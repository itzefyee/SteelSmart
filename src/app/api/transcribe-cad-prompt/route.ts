import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase-server';

const MAX_BASE64_AUDIO_LENGTH = 6_500_000;
const ALLOWED_MIME_TYPES = new Set(['audio/webm', 'audio/ogg', 'audio/wav', 'audio/mpeg', 'audio/mp3']);
const GEMINI_INTERACTIONS_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/interactions';

type TranscriptionRequest = {
  audio?: string;
  mimeType?: string;
};

type GeminiInteractionResponse = {
  output_text?: unknown;
  error?: {
    message?: unknown;
  };
};

function normaliseMimeType(mimeType?: string): string | null {
  const normalised = mimeType?.split(';')[0]?.trim().toLowerCase();
  return normalised && ALLOWED_MIME_TYPES.has(normalised) ? normalised : null;
}

async function getEngineeringVocabulary(): Promise<string[]> {
  try {
    const supabase = await getSupabaseServer();
    const [taxonomyResult, materialResult] = await Promise.all([
      supabase.from('component_taxonomy').select('canonical_name, keywords').limit(200),
      supabase.from('material_synonyms').select('family, synonyms').limit(100),
    ]);

    const terms = [
      ...(taxonomyResult.data ?? []).flatMap((row) => [row.canonical_name, ...(row.keywords ?? [])]),
      ...(materialResult.data ?? []).flatMap((row) => [row.family, ...(row.synonyms ?? [])]),
    ]
      .map((term) => term.trim())
      .filter(Boolean);

    return [...new Set(terms)].slice(0, 1_000);
  } catch (error) {
    // Transcription should still work when taxonomy data is temporarily unavailable.
    console.warn('Could not load CAD transcription vocabulary:', error);
    return [];
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { error: 'Gemini transcription is not configured. Set GEMINI_API_KEY and try again.' },
        { status: 503 }
      );
    }

    const body = await request.json() as TranscriptionRequest;
    const mimeType = normaliseMimeType(body.mimeType);
    const audio = body.audio?.replace(/\s/g, '');

    if (!audio || !mimeType || !/^[A-Za-z0-9+/]+={0,2}$/.test(audio)) {
      return NextResponse.json({ error: 'A supported audio recording is required.' }, { status: 400 });
    }

    if (audio.length > MAX_BASE64_AUDIO_LENGTH) {
      return NextResponse.json(
        { error: 'The recording is too large. Keep CAD voice prompts under about one minute.' },
        { status: 413 }
      );
    }

    const vocabulary = await getEngineeringVocabulary();
    const response = await fetch(GEMINI_INTERACTIONS_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': process.env.GEMINI_API_KEY,
      },
      cache: 'no-store',
      body: JSON.stringify({
        model: process.env.GEMINI_TRANSCRIPTION_MODEL || 'gemini-3.5-transcribe',
        input: [{ type: 'audio', data: audio, mime_type: mimeType }],
        generation_config: {
          transcription_config: {
            mode: 'smart',
            custom_vocabulary: vocabulary,
          },
        },
      }),
    });
    const providerResponse = await response.json().catch(() => null) as GeminiInteractionResponse | null;

    if (!response.ok) {
      const providerMessage = typeof providerResponse?.error?.message === 'string'
        ? providerResponse.error.message
        : 'No provider error message was returned.';
      console.error('Gemini CAD transcription request failed:', { status: response.status, providerMessage });
      return NextResponse.json(
        { error: 'The transcription service could not process this recording. Please try again.' },
        { status: 502 }
      );
    }

    const transcript = typeof providerResponse?.output_text === 'string'
      ? providerResponse.output_text.replace(/\s+/g, ' ').trim()
      : '';
    if (!transcript) {
      return NextResponse.json({ error: 'No speech was detected in the recording.' }, { status: 422 });
    }

    return NextResponse.json({ transcript });
  } catch (error) {
    console.error('CAD prompt transcription failed:', error);
    return NextResponse.json(
      { error: 'Could not transcribe the recording. Please try again.' },
      { status: 502 }
    );
  }
}
