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

    // file_url now contains the full public URL, but we still provide backward compatibility
    let publicFileUrl = report.file_url;
    if (report.file_url && !report.file_url.startsWith('http')) {
      // Legacy support: generate public URL for old storage paths
      publicFileUrl = await service.getReportFileUrl(report);
    }

    return NextResponse.json({ 
      data: {
        ...report,
        public_file_url: publicFileUrl
      }
    });
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
