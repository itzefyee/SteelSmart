import { AdminReportDetailsContent } from '@/components/admin/reports/AdminReportDetailsContent';

interface ReportDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function ReportDetailPage({ params }: ReportDetailPageProps) {
  const { id } = await params;
  return <AdminReportDetailsContent reportId={id} />;
}
