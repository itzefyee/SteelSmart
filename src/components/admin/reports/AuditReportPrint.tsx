'use client';

import React from 'react';

// Same interface as the main component
interface AuditReportData {
  reportId: string;
  period: string;
  generatedAt: string;
  summary: {
    totalActions: number;
    successRate: number;
    failedCount: number;
    uniqueUsers: number;
  };
  logs: Array<{
    timestamp: string;
    userEmail: string;
    action: string;
    module: string;
    status: "SUCCESS" | "FAILED";
  }>;
}

interface AuditReportPrintProps {
  data: AuditReportData;
  currentPage?: number;
  totalPages?: number;
}

export function AuditReportPrint({ data, currentPage = 1, totalPages = 1 }: AuditReportPrintProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('en-US', {
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  return (
    <div 
      className="bg-white text-black font-sans"
      style={{
        width: '210mm',
        minHeight: '297mm',
        padding: '20mm',
        margin: '0 auto',
        fontSize: '12px',
        lineHeight: '1.4',
        color: '#000',
        fontFamily: 'Arial, sans-serif'
      }}
    >
      {/* Print Styles */}
      <style jsx>{`
        @media print {
          .audit-report {
            width: 100% !important;
            margin: 0 !important;
            padding: 15mm !important;
            font-size: 11px !important;
          }
          
          .no-break {
            page-break-inside: avoid;
          }
          
          .page-break {
            page-break-before: always;
          }
        }
        
        .kpi-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 10px;
          margin-bottom: 20px;
        }
        
        .kpi-card {
          background-color: #f8f9fa;
          padding: 12px;
          border: 1px solid #dee2e6;
          border-radius: 4px;
        }
        
        .audit-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 20px;
        }
        
        .audit-table th {
          background-color: #1a3c5e;
          color: white;
          padding: 8px;
          text-align: left;
          font-weight: bold;
          border: 1px solid #ccc;
        }
        
        .audit-table td {
          padding: 6px 8px;
          border: 1px solid #ccc;
          font-size: 11px;
        }
        
        .audit-table tr:nth-child(even) {
          background-color: #f8f9fa;
        }
        
        .status-success {
          color: #28a745;
          font-weight: bold;
        }
        
        .status-failed {
          color: #dc3545;
          font-weight: bold;
        }
      `}</style>

      <div className="audit-report">
        {/* Header Section */}
        <div style={{ marginBottom: '30px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px' }}>
            {/* Left Column */}
            <div>
              <h1 style={{ 
                fontSize: '24px', 
                fontWeight: 'bold', 
                color: '#1a3c5e', 
                margin: '0 0 5px 0' 
              }}>
                SteelSmart Inc.
              </h1>
              <p style={{ 
                fontSize: '14px', 
                color: '#666', 
                margin: '0' 
              }}>
                System Audit Report
              </p>
            </div>
            
            {/* Right Column */}
            <div style={{ textAlign: 'right', fontSize: '12px' }}>
              <div style={{ marginBottom: '3px' }}>
                <strong>Report ID:</strong> {data.reportId}
              </div>
              <div style={{ marginBottom: '3px' }}>
                <strong>Generated:</strong> {formatDate(data.generatedAt)}
              </div>
              <div>
                <strong>Period:</strong> {data.period}
              </div>
            </div>
          </div>
          
          {/* Horizontal separator */}
          <hr style={{ 
            border: 'none', 
            borderTop: '2px solid #1a3c5e', 
            margin: '0' 
          }} />
        </div>

        {/* Section 1: Executive Summary */}
        <div className="no-break" style={{ marginBottom: '30px' }}>
          <h2 style={{ 
            fontSize: '16px', 
            fontWeight: 'bold', 
            color: '#2c3e50', 
            marginBottom: '15px' 
          }}>
            Executive Summary
          </h2>
          
          <div className="kpi-grid">
            {/* Total Actions Card */}
            <div className="kpi-card">
              <div style={{ 
                fontSize: '10px', 
                color: '#666', 
                textTransform: 'uppercase', 
                letterSpacing: '0.5px',
                marginBottom: '5px' 
              }}>
                Total Actions
              </div>
              <div style={{ 
                fontSize: '18px', 
                fontWeight: 'bold', 
                color: '#1a3c5e' 
              }}>
                {data.summary.totalActions.toLocaleString()}
              </div>
            </div>

            {/* Success Rate Card */}
            <div className="kpi-card">
              <div style={{ 
                fontSize: '10px', 
                color: '#666', 
                textTransform: 'uppercase', 
                letterSpacing: '0.5px',
                marginBottom: '5px' 
              }}>
                Success Rate
              </div>
              <div style={{ 
                fontSize: '18px', 
                fontWeight: 'bold',
                color: data.summary.successRate >= 95 ? '#28a745' : 
                       data.summary.successRate >= 85 ? '#ffc107' : '#dc3545'
              }}>
                {data.summary.successRate.toFixed(1)}%
              </div>
            </div>

            {/* Critical Failures Card */}
            <div className="kpi-card">
              <div style={{ 
                fontSize: '10px', 
                color: '#666', 
                textTransform: 'uppercase', 
                letterSpacing: '0.5px',
                marginBottom: '5px' 
              }}>
                Critical Failures
              </div>
              <div style={{ 
                fontSize: '18px', 
                fontWeight: 'bold',
                color: data.summary.failedCount === 0 ? '#28a745' : 
                       data.summary.failedCount <= 5 ? '#ffc107' : '#dc3545'
              }}>
                {data.summary.failedCount}
              </div>
            </div>

            {/* Active Users Card */}
            <div className="kpi-card">
              <div style={{ 
                fontSize: '10px', 
                color: '#666', 
                textTransform: 'uppercase', 
                letterSpacing: '0.5px',
                marginBottom: '5px' 
              }}>
                Active Users
              </div>
              <div style={{ 
                fontSize: '18px', 
                fontWeight: 'bold', 
                color: '#1a3c5e' 
              }}>
                {data.summary.uniqueUsers}
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Detailed Activity Log */}
        <div style={{ marginBottom: '30px' }}>
          <h2 style={{ 
            fontSize: '16px', 
            fontWeight: 'bold', 
            color: '#2c3e50', 
            marginBottom: '15px' 
          }}>
            Detailed Activity Log
          </h2>
          
          <table className="audit-table">
            <thead>
              <tr>
                <th style={{ width: '18%' }}>Timestamp</th>
                <th style={{ width: '25%' }}>User</th>
                <th style={{ width: '22%' }}>Action</th>
                <th style={{ width: '20%' }}>Module</th>
                <th style={{ width: '15%' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {data.logs.map((log, index) => (
                <tr key={index}>
                  <td>{formatTimestamp(log.timestamp)}</td>
                  <td>{log.userEmail}</td>
                  <td style={{ fontWeight: '500' }}>
                    {log.action.replace(/_/g, ' ')}
                  </td>
                  <td>{log.module}</td>
                  <td>
                    <span className={log.status === 'SUCCESS' ? 'status-success' : 'status-failed'}>
                      {log.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {data.logs.length === 0 && (
            <div style={{ 
              textAlign: 'center', 
              padding: '30px', 
              color: '#666',
              fontStyle: 'italic' 
            }}>
              No audit logs found for the selected period.
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ 
          marginTop: '40px', 
          paddingTop: '15px', 
          borderTop: '1px solid #ccc',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '11px',
          color: '#666'
        }}>
          <div style={{ flex: 1, textAlign: 'center' }}>
            <strong>Confidential - Internal Use Only</strong>
          </div>
          <div>
            Page {currentPage} of {totalPages}
          </div>
        </div>
      </div>
    </div>
  );
}