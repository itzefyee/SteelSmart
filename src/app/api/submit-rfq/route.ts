import { NextRequest, NextResponse } from 'next/server';
import { APIResponse } from '@/types';
import { getSupabaseServer } from '@/lib/supabase-server';
import { RFQRepository } from '@/repositories/rfq.repository';
import { handleApiError } from '@/lib/api/error-handler';
import {
  validateRFQContact,
  validateRFQRequirements,
} from '@/lib/validation/rfq.schemas';

/**
 * Convert deadline string to ISO date string
 * Handles relative deadlines like "2 weeks", "1 month", "ASAP"
 * Returns null if the deadline can't be parsed
 */
function parseDeadlineToDate(deadline: string | null): string | null {
  if (!deadline || deadline.trim() === '') {
    return null;
  }

  const trimmed = deadline.trim().toLowerCase();
  const now = new Date();

  // Handle relative time expressions
  const weekMatch = trimmed.match(/^(\d+)\s*weeks?$/i);
  if (weekMatch) {
    const weeks = parseInt(weekMatch[1]);
    now.setDate(now.getDate() + weeks * 7);
    return now.toISOString().split('T')[0];
  }

  const monthMatch = trimmed.match(/^(\d+)\s*months?$/i);
  if (monthMatch) {
    const months = parseInt(monthMatch[1]);
    now.setMonth(now.getMonth() + months);
    return now.toISOString().split('T')[0];
  }

  const dayMatch = trimmed.match(/^(\d+)\s*days?$/i);
  if (dayMatch) {
    const days = parseInt(dayMatch[1]);
    now.setDate(now.getDate() + days);
    return now.toISOString().split('T')[0];
  }

  // Handle ASAP - set to 1 week from now
  if (trimmed === 'asap' || trimmed === 'urgent') {
    now.setDate(now.getDate() + 7);
    return now.toISOString().split('T')[0];
  }

  // Handle "flexible" or "no rush" - set to 1 month from now
  if (trimmed === 'flexible' || trimmed === 'no rush') {
    now.setMonth(now.getMonth() + 1);
    return now.toISOString().split('T')[0];
  }

  // Try to parse as a date string (ISO format or common formats)
  const parsed = new Date(deadline);
  if (!isNaN(parsed.getTime())) {
    return parsed.toISOString().split('T')[0];
  }

  // If we can't parse it, return null (database will accept null)
  return null;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const formData = await request.formData();

    // Debug: Log all form data entries
    console.log('RFQ Form Data received:');
    for (const [key, value] of formData.entries()) {
      console.log(`  ${key}: ${typeof value === 'string' ? value.substring(0, 100) : '[File]'}`);
    }

    // Extract form data - handle null values from formData.get()
    const contactInfo = {
      name: (formData.get('name') as string) || '',
      email: (formData.get('email') as string) || '',
      company: (formData.get('company') as string) || '',
      phone: (formData.get('phone') as string) || '',
    };

    const quantityStr = formData.get('quantity') as string;
    const quantity = parseInt(quantityStr) || 1;

    const requirements = {
      projectDescription: (formData.get('projectDescription') as string) || '',
      quantity: quantity,
      material: (formData.get('material') as string) || '',
      specifications: (formData.get('specifications') as string) || '',
      deadline: (formData.get('deadline') as string) || '',
      budget: (formData.get('budget') as string) || '',
    };

    console.log('Parsed contact:', contactInfo);
    console.log('Parsed requirements:', requirements);

    // Validation
    validateRFQContact(contactInfo);
    validateRFQRequirements(requirements);

    // Get authenticated user (required for RFQ submission)
    const supabase = await getSupabaseServer();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json<APIResponse<null>>({
        success: false,
        error: 'Authentication required. Please log in to submit an RFQ.'
      }, { status: 401 });
    }

    // Handle file uploads
    const attachedFiles: string[] = [];
    const files = formData.getAll('files');

    for (const file of files) {
      if (file instanceof File && file.size > 0) {
        try {
          const fileBuffer = Buffer.from(await file.arrayBuffer());
          const filePath = `${user.id}/${Date.now()}_${file.name}`;

          const { error: uploadError } = await supabase.storage
            .from('rfq-attachments')
            .upload(filePath, fileBuffer, {
              contentType: file.type,
              upsert: false
            });

          if (uploadError) {
            console.error('Failed to upload RFQ attachment:', uploadError);
          } else {
            attachedFiles.push(filePath);
          }
        } catch (uploadError) {
          console.error('Error processing file upload:', uploadError);
        }
      }
    }

    // Save RFQ using repository
    const repository = new RFQRepository(supabase);
    const rfqInput = {
      user_id: user.id,
      contact_name: contactInfo.name,
      contact_email: contactInfo.email,
      contact_company: contactInfo.company || null,
      contact_phone: contactInfo.phone || null,
      project_description: requirements.projectDescription,
      quantity: requirements.quantity,
      material: requirements.material || null,
      specifications: requirements.specifications,
      deadline: parseDeadlineToDate(requirements.deadline),
      budget: requirements.budget || null,
      attached_files: attachedFiles.length > 0 ? attachedFiles : null,
      status: 'pending'
    };
    
    const rfq = await repository.create(rfqInput);

    // TODO: Send confirmation email to user
    // TODO: Notify sales team

    // Return the created RFQ in the format expected by the client
    return NextResponse.json<APIResponse<{ id: string; rfqId: string }>>({
      success: true,
      data: { 
        id: rfq.id,
        rfqId: rfq.id 
      },
      message: 'RFQ submitted successfully. You will receive a confirmation email shortly.'
    });

  } catch (error) {
    return handleApiError(error);
  }
}
