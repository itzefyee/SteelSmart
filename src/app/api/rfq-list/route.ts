import { NextRequest, NextResponse } from 'next/server';
import { APIResponse } from '@/types';
import { getSupabaseServer } from '@/lib/supabase-server';
import { RFQRepository } from '@/repositories/rfq.repository';
import { RFQService } from '@/services/rfq.service';
import { handleApiError } from '@/lib/api/error-handler';

export async function GET(request: NextRequest) {
  try {
    const supabase = await getSupabaseServer();

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json<APIResponse<null>>({
        success: false,
        error: 'Authentication required'
      }, { status: 401 });
    }

    // Fetch user's RFQ submissions using repository directly
    const repository = new RFQRepository(supabase);
    const rfqData = await repository.findByUserId(user.id);

    // Transform data to match frontend expectations
    const transformedData = rfqData.map(rfq => ({
      id: rfq.id,
      drawing: rfq.project_description || 'RFQ Submission',
      quantity: rfq.quantity,
      status: mapStatus(rfq.status || 'pending'),
      submittedDate: rfq.created_at ? new Date(rfq.created_at).toLocaleDateString() : 'N/A',
      expectedDelivery: rfq.deadline || 'TBD',
      priority: 'Medium', // Default priority - could be enhanced
      contactInfo: {
        name: rfq.contact_name,
        email: rfq.contact_email,
        company: rfq.contact_company,
        phone: rfq.contact_phone
      },
      requirements: {
        projectDescription: rfq.project_description,
        quantity: rfq.quantity,
        material: rfq.material,
        specifications: rfq.specifications,
        deadline: rfq.deadline,
        budget: rfq.budget
      },
      attachedFiles: rfq.attached_files || [],
      createdAt: rfq.created_at,
      updatedAt: rfq.updated_at
    }));

    return NextResponse.json<APIResponse<typeof transformedData>>({
      success: true,
      data: transformedData
    });

  } catch (error) {
    return handleApiError(error);
  }
}

// Map database status to frontend status
function mapStatus(dbStatus: string): 'Submitted' | 'In Review' | 'Approved' | 'Rejected' | 'Completed' {
  switch (dbStatus) {
    case 'pending':
      return 'Submitted';
    case 'in_review':
      return 'In Review';
    case 'approved':
      return 'Approved';
    case 'rejected':
      return 'Rejected';
    case 'completed':
      return 'Completed';
    default:
      return 'Submitted';
  }
}