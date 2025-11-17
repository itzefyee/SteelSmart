import { NextRequest, NextResponse } from 'next/server';
import { APIResponse } from '@/types';
import { getSupabaseServer } from '@/lib/supabase-server';

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

    // Fetch user's RFQ submissions
    const { data: rfqData, error: fetchError } = await supabase
      .from('rfq_submissions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (fetchError) {
      console.error('Error fetching RFQ submissions:', fetchError);
      return NextResponse.json<APIResponse<null>>({
        success: false,
        error: 'Failed to fetch RFQ submissions'
      }, { status: 500 });
    }

    // Transform data to match frontend expectations
    const transformedData = rfqData.map(rfq => ({
      id: rfq.id,
      drawing: rfq.project_description || 'RFQ Submission',
      quantity: rfq.quantity,
      status: mapStatus(rfq.status),
      submittedDate: new Date(rfq.created_at).toLocaleDateString(),
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
    console.error('Error in RFQ list API:', error);
    return NextResponse.json<APIResponse<null>>({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
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