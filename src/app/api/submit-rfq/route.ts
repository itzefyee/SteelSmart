import { NextRequest, NextResponse } from 'next/server';
import { APIResponse } from '@/types';
import { getSupabaseServer } from '@/lib/supabase-server';
import { RFQRepository } from '@/repositories/rfq.repository';
import { RFQService } from '@/services/rfq.service';
import { handleApiError } from '@/lib/api/error-handler';
import {
  validateRFQContact,
  validateRFQRequirements,
} from '@/lib/validation/rfq.schemas';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    // Extract form data
    const contactInfo = {
      name: formData.get('name') as string,
      email: formData.get('email') as string,
      company: formData.get('company') as string,
      phone: formData.get('phone') as string,
    };

    const quantityStr = formData.get('quantity') as string;
    const quantity = parseInt(quantityStr) || 1;

    const requirements = {
      projectDescription: formData.get('projectDescription') as string,
      quantity: quantity,
      material: formData.get('material') as string,
      specifications: formData.get('specifications') as string,
      deadline: formData.get('deadline') as string,
      budget: formData.get('budget') as string,
    };

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
      deadline: requirements.deadline || null,
      budget: requirements.budget || null,
      attached_files: attachedFiles.length > 0 ? attachedFiles : null,
      status: 'pending'
    };
    
    const rfq = await repository.create(rfqInput);
    const rfqId = rfq.id;



    // TODO: Send confirmation email to user
    // TODO: Notify sales team

    return NextResponse.json<APIResponse<{ rfqId: string }>>({
      success: true,
      data: { rfqId },
      message: 'RFQ submitted successfully. You will receive a confirmation email shortly.'
    });

  } catch (error) {
    return handleApiError(error);
  }
}
