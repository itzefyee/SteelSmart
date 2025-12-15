import { AdminReportDetailsContent } from '@/components/admin/reports/AdminReportDetailsContent';

interface ReportDetailPageProps {
  params: { id: string };
}

export default function ReportDetailPage({ params }: ReportDetailPageProps) {
  return <AdminReportDetailsContent reportId={params.id} />;
}
