import { NextRequest, NextResponse } from 'next/server';
import { APIResponse } from '@/types';

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

    const requirements = {
      projectDescription: formData.get('projectDescription') as string,
      quantity: parseInt(formData.get('quantity') as string),
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

    // Generate RFQ reference number
    const rfqId = `RFQ-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;

    // Here you would typically:
    // 1. Save to database
    // 2. Send confirmation email
    // 3. Notify sales team
    // For now, we'll just return success

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