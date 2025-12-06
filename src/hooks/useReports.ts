import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  getReportListing, 
  getReportDetails, 
  generateReport, 
  deleteReport as deleteReportApi, 
  retryReport as retryReportApi,
  createMonthlyMostQuotedReport as createMonthlyReportApi,
  getReportStatistics,
  type ReportGenerateParams 
} from '@/lib/api/admin-reports';

export const useReports = (page: number = 1, limit: number = 10) => {
  return useQuery({
    queryKey: ['reports', page, limit],
    queryFn: async () => {
      const result = await getReportListing(page, limit);
      if (result.error) throw new Error(result.error);
      return result.data!;
    },
    staleTime: 30000, // 30 seconds
  });
};

export const useReport = (reportId: string) => {
  return useQuery({
    queryKey: ['report', reportId],
    queryFn: async () => {
      const result = await getReportDetails(reportId);
      if (result.error) throw new Error(result.error);
      return result.data!;
    },
    enabled: !!reportId,
    refetchInterval: (query) => {
      // Auto-refresh if report is still processing
      const data = query.state.data;
      return data?.status === 'PROCESSING' || data?.status === 'PENDING' ? 2000 : false;
    },
  });
};

export const useCreateReport = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (request: ReportGenerateParams) => {
      const result = await generateReport(request);
      if (result.error) throw new Error(result.error);
      return result.data!.reportId;
    },
    onSuccess: (reportId) => {
      queryClient.invalidateQueries({ queryKey: ['reports'] });
      console.log('Report generation started successfully');
      return reportId;
    },
    onError: (error: Error) => {
      console.error(`Failed to create report: ${error.message}`);
    },
  });
};

export const useDeleteReport = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (reportId: string) => {
      const result = await deleteReportApi(reportId);
      if (result.error) throw new Error(result.error);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reports'] });
      console.log('Report deleted successfully');
    },
    onError: (error: Error) => {
      console.error(`Failed to delete report: ${error.message}`);
    },
  });
};

export const useRetryReport = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (reportId: string) => {
      const result = await retryReportApi(reportId);
      if (result.error) throw new Error(result.error);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reports'] });
      console.log('Report retry initiated');
    },
    onError: (error: Error) => {
      console.error(`Failed to retry report: ${error.message}`);
    },
  });
};

export const useCreateMonthlyMostQuotedReport = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ month, year }: { month: number; year: number }) => {
      const result = await createMonthlyReportApi(month, year);
      if (result.error) throw new Error(result.error);
      return result.data!.reportId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reports'] });
      console.log('Monthly report generation started');
    },
    onError: (error: Error) => {
      console.error(`Failed to create monthly report: ${error.message}`);
    },
  });
};

export const useReportStatistics = () => {
  return useQuery({
    queryKey: ['report-statistics'],
    queryFn: async () => {
      const result = await getReportStatistics();
      if (result.error) throw new Error(result.error);
      return result.data!;
    },
    staleTime: 60000, // 1 minute
  });
};