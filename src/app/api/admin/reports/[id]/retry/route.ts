import { NextRequest, NextResponse } from 'next/server';
import { ReportService } from '@/services/admin/report.service';
import { handleApiError } from '@/lib/api/error-handler';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const service = new ReportService();
    await service.retry(id);

    return NextResponse.json({
      message: 'Report retry initiated',
    });
  } catch (error) {
    return handleApiError(error);
  }
}
