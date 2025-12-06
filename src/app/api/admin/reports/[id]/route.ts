import { NextRequest, NextResponse } from 'next/server';
import { ReportService } from '@/services/admin/report.service';
import { handleApiError } from '@/lib/api/error-handler';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const service = new ReportService();
    const report = await service.getById(id);

    return NextResponse.json({ data: report });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const service = new ReportService();
    await service.delete(id);

    return NextResponse.json({
      message: 'Report deleted successfully',
    });
  } catch (error) {
    return handleApiError(error);
  }
}
