// Client-side audit logging helper
export class AuditClient {
  static async logProduct(
    action: 'CREATE' | 'UPDATE' | 'DELETE',
    product: { id: string; name: string },
    status: 'SUCCESS' | 'FAILED' = 'SUCCESS'
  ) {
    try {
      await fetch('/api/audit-log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          module: 'PRODUCT',
          entityId: product.id,
          entityName: product.name,
          status
        })
      });
    } catch (error) {
      console.error('Failed to log product audit:', error);
    }
  }

  static async logReport(
    action: 'CREATE' | 'DELETE',
    report: { id: string; title: string },
    status: 'SUCCESS' | 'FAILED' = 'SUCCESS'
  ) {
    try {
      await fetch('/api/audit-log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          module: 'REPORT',
          entityId: report.id,
          entityName: report.title,
          status
        })
      });
    } catch (error) {
      console.error('Failed to log report audit:', error);
    }
  }

  static async logAuth(action: 'LOGIN' | 'LOGOUT') {
    // Make audit logging non-blocking by not awaiting the fetch
    fetch('/api/audit-log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action,
        module: 'AUTH'
      })
    }).catch(error => {
      console.warn('Failed to log auth audit (non-critical):', error);
    });
  }
}