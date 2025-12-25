import { NextRequest, NextResponse } from 'next/server';
import { ReportService } from '@/services/admin/report.service';
import { handleApiError } from '@/lib/api/error-handler';

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const status = searchParams.get('status') as any;

    const service = new ReportService();
    const result = await service.getAll({ status }, page, limit);

    return NextResponse.json({
      data: result.reports,
      pagination: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: result.totalPages,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    
    const service = new ReportService();
    const reportId = await service.createAndGenerate(body);

    return NextResponse.json(
      { data: { reportId }, message: 'Report generation started' },
      { status: 201 }
    );
  } catch (error) {
    console.error('API Error in POST /api/admin/reports:', error);
    return handleApiError(error);
  }
}
