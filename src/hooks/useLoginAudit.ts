import { useCallback } from 'react';
import { AuditClient } from '@/lib/audit-client';

export function useLoginAudit() {
  const logLoginSuccess = useCallback(async () => {
    try {
      await AuditClient.logAuth('LOGIN');
    } catch (error) {
      console.error('Failed to log login success:', error);
    }
  }, []);

  return {
    logLoginSuccess,
  };
}