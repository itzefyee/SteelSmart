import { NextRequest, NextResponse } from 'next/server';
import { ReportService } from '@/services/admin/report.service';
import { handleApiError } from '@/lib/api/error-handler';

export async function GET(request: NextRequest) {
  try {
    const service = new ReportService();
    const stats = await service.getStatistics();

    return NextResponse.json({ data: stats });
  } catch (error) {
    return handleApiError(error);
  }
}
