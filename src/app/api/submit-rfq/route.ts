import { NextRequest, NextResponse } from 'next/server';
import { APIResponse } from '@/types';
import { getSupabaseServer } from '@/lib/supabase-server';
import { parseDeadlineToDate } from '@/lib/deadline-utils';

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
    const quantity = parseInt(quantityStr) || 1; // Default to 1 if parsing fails
    
    const requirements = {
      projectDescription: formData.get('projectDescription') as string,
      quantity: quantity,
      material: formData.get('material') as string,
      specifications: formData.get('specifications') as string,
      deadline: formData.get('deadline') as string,
      budget: formData.get('budget') as string,
    };
    


    // Basic validation
    if (!contactInfo.name || !contactInfo.email || !requirements.projectDescription) {
      return NextResponse.json<APIResponse<null>>({
        success: false,
        error: 'Required fields are missing'
      }, { status: 400 });
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(contactInfo.email)) {
      return NextResponse.json<APIResponse<null>>({
        success: false,
        error: 'Invalid email address'
      }, { status: 400 });
    }

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

    // Save RFQ to database
    const { data: rfqData, error: insertError } = await supabase
      .from('rfq_submissions')
      .insert({
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
        attached_files: attachedFiles,
        status: 'pending'
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error saving RFQ to database:', insertError);
      return NextResponse.json<APIResponse<null>>({
        success: false,
        error: 'Failed to save RFQ. Please try again.'
      }, { status: 500 });
    }

    const rfqId = rfqData.id;



    // TODO: Send confirmation email to user
    // TODO: Notify sales team

    return NextResponse.json<APIResponse<{ rfqId: string }>>({
      success: true,
      data: { rfqId },
      message: 'RFQ submitted successfully. You will receive a confirmation email shortly.'
    });

  } catch (error) {
    console.error('Error submitting RFQ:', error);
    return NextResponse.json<APIResponse<null>>({
      success: false,
      error: 'Internal server error during RFQ submission'
    }, { status: 500 });
  }
}
