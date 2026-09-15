'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

const SUPPORTED_MIME_TYPES = ['audio/webm;codecs=opus', 'audio/webm'];

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Could not read the recorded audio.'));
    reader.onload = () => {
      const result = reader.result;
      if (typeof result !== 'string') {
        reject(new Error('Could not encode the recorded audio.'));
        return;
      }
      resolve(result.slice(result.indexOf(',') + 1));
    };
    reader.readAsDataURL(blob);
  });
}

/**
 * Records a short microphone clip and asks the server-side Gemini integration
 * to transcribe it. It deliberately does not use the browser Web Speech API so
 * engineering vocabulary has one consistent server-side recognition path.
 */
export function useSpeechInput() {
  const [isListening, setIsListening] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const mountedRef = useRef(true);

  const releaseStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  }, []);

  const transcribe = useCallback(async (audio: Blob) => {
    if (audio.size === 0) {
      if (mountedRef.current) setError('No audio was captured. Please try again.');
      return;
    }

    if (mountedRef.current) setIsTranscribing(true);

    try {
      const audioData = await blobToBase64(audio);
      const response = await fetch('/api/transcribe-cad-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ audio: audioData, mimeType: audio.type || 'audio/webm' }),
      });
      const body = await response.json() as { transcript?: string; error?: string };

      if (!response.ok || !body.transcript) {
        throw new Error(body.error || 'Could not transcribe the recording.');
      }

      if (mountedRef.current) setTranscript(body.transcript.trim());
    } catch (caughtError) {
      if (mountedRef.current) {
        setError(caughtError instanceof Error ? caughtError.message : 'Could not transcribe the recording.');
      }
    } finally {
      if (mountedRef.current) setIsTranscribing(false);
    }
  }, []);

  const start = useCallback(async () => {
    if (isListening || isTranscribing) return;

    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
      setError('Microphone recording is not supported in this browser.');
      return;
    }

    setError(null);
    setTranscript('');

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = SUPPORTED_MIME_TYPES.find((type) => MediaRecorder.isTypeSupported(type));
      const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
      const chunks: BlobPart[] = [];

      streamRef.current = stream;
      recorderRef.current = recorder;
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunks.push(event.data);
      };
      recorder.onstop = () => {
        recorderRef.current = null;
        releaseStream();
        void transcribe(new Blob(chunks, { type: recorder.mimeType || 'audio/webm' }));
      };
      recorder.onerror = () => {
        releaseStream();
        recorderRef.current = null;
        if (mountedRef.current) {
          setIsListening(false);
          setError('Recording stopped unexpectedly. Please try again.');
        }
      };

      recorder.start();
      setIsListening(true);
    } catch (caughtError) {
      releaseStream();
      setError(
        caughtError instanceof DOMException && caughtError.name === 'NotAllowedError'
          ? 'Microphone permission was denied. Enable it in your browser settings and try again.'
          : 'Could not start the microphone. Please try again.'
      );
    }
  }, [isListening, isTranscribing, releaseStream, transcribe]);

  const stop = useCallback(() => {
    const recorder = recorderRef.current;
    if (recorder?.state === 'recording') {
      recorder.stop();
      setIsListening(false);
    }
  }, []);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
      const recorder = recorderRef.current;
      if (recorder && recorder.state !== 'inactive') recorder.stop();
      releaseStream();
    };
  }, [releaseStream]);

  return { isListening, isTranscribing, transcript, start, stop, error };
}
