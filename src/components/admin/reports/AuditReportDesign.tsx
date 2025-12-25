'use client';

import React from 'react';

// TypeScript interface for the audit report data
interface AuditReportData {
  reportId: string;
  period: string; // e.g., "November 2025"
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
    action: string; // e.g., "CREATE_PRODUCT"
    module: string; // e.g., "INVENTORY"
    status: "SUCCESS" | "FAILED";
  }>;
}

interface AuditReportProps {
  data: AuditReportData;
  currentPage?: number;
  totalPages?: number;
}

export function AuditReportDesign({ data, currentPage = 1, totalPages = 1 }: AuditReportProps) {
  // Format date for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Format timestamp for table
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
    <div className="bg-white text-black min-h-screen p-8 font-sans">
      {/* Header Section */}
      <div className="mb-8">
        <div className="flex justify-between items-start mb-4">
          {/* Left Column */}
          <div>
            <h1 className="text-3xl font-bold text-[#1a3c5e] mb-1">
              SteelSmart Inc.
            </h1>
            <p className="text-sm text-gray-600">
              System Audit Report
            </p>
          </div>
          
          {/* Right Column */}
          <div className="text-right text-sm">
            <div className="mb-1">
              <span className="font-semibold">Report ID:</span> {data.reportId}
            </div>
            <div className="mb-1">
              <span className="font-semibold">Generated:</span> {formatDate(data.generatedAt)}
            </div>
            <div>
              <span className="font-semibold">Period:</span> {data.period}
            </div>
          </div>
        </div>
        
        {/* Horizontal separator */}
        <hr className="border-t-2 border-[#1a3c5e]" />
      </div>

      {/* Section 1: Executive Summary (KPI Cards) */}
      <div className="mb-8">
        <h2 className="text-xl font-bold text-[#2c3e50] mb-4">Executive Summary</h2>
        
        {/* 4-column grid for KPI cards */}
        <div className="grid grid-cols-4 gap-4">
          {/* Total Actions Card */}
          <div className="bg-[#f8f9fa] p-4 rounded-lg border">
            <div className="text-xs text-gray-600 uppercase tracking-wide mb-1">
              Total Actions
            </div>
            <div className="text-2xl font-bold text-[#1a3c5e]">
              {data.summary.totalActions.toLocaleString()}
            </div>
          </div>

          {/* Success Rate Card */}
          <div className="bg-[#f8f9fa] p-4 rounded-lg border">
            <div className="text-xs text-gray-600 uppercase tracking-wide mb-1">
              Success Rate
            </div>
            <div className={`text-2xl font-bold ${
              data.summary.successRate >= 95 ? 'text-green-600' : 
              data.summary.successRate >= 85 ? 'text-yellow-600' : 'text-red-600'
            }`}>
              {data.summary.successRate.toFixed(1)}%
            </div>
          </div>

          {/* Critical Failures Card */}
          <div className="bg-[#f8f9fa] p-4 rounded-lg border">
            <div className="text-xs text-gray-600 uppercase tracking-wide mb-1">
              Critical Failures
            </div>
            <div className={`text-2xl font-bold ${
              data.summary.failedCount === 0 ? 'text-green-600' : 
              data.summary.failedCount <= 5 ? 'text-yellow-600' : 'text-red-600'
            }`}>
              {data.summary.failedCount}
            </div>
          </div>

          {/* Active Users Card */}
          <div className="bg-[#f8f9fa] p-4 rounded-lg border">
            <div className="text-xs text-gray-600 uppercase tracking-wide mb-1">
              Active Users
            </div>
            <div className="text-2xl font-bold text-[#1a3c5e]">
              {data.summary.uniqueUsers}
            </div>
          </div>
        </div>
      </div>

      {/* Section 2: Detailed Activity Log */}
      <div className="mb-8">
        <h2 className="text-xl font-bold text-[#2c3e50] mb-4">Detailed Activity Log</h2>
        
        {/* Full-width table */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border border-gray-300">
            {/* Header row with Navy Blue background */}
            <thead>
              <tr className="bg-[#1a3c5e] text-white">
                <th className="border border-gray-300 px-4 py-3 text-left font-semibold">
                  Timestamp
                </th>
                <th className="border border-gray-300 px-4 py-3 text-left font-semibold">
                  User
                </th>
                <th className="border border-gray-300 px-4 py-3 text-left font-semibold">
                  Action
                </th>
                <th className="border border-gray-300 px-4 py-3 text-left font-semibold">
                  Module
                </th>
                <th className="border border-gray-300 px-4 py-3 text-left font-semibold">
                  Status
                </th>
              </tr>
            </thead>
            
            {/* Data rows with zebra striping */}
            <tbody>
              {data.logs.map((log, index) => (
                <tr 
                  key={index} 
                  className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
                >
                  <td className="border border-gray-300 px-4 py-2 text-sm">
                    {formatTimestamp(log.timestamp)}
                  </td>
                  <td className="border border-gray-300 px-4 py-2 text-sm">
                    {log.userEmail}
                  </td>
                  <td className="border border-gray-300 px-4 py-2 text-sm font-medium">
                    {log.action.replace(/_/g, ' ')}
                  </td>
                  <td className="border border-gray-300 px-4 py-2 text-sm">
                    {log.module}
                  </td>
                  <td className="border border-gray-300 px-4 py-2 text-sm font-semibold">
                    <span className={
                      log.status === 'SUCCESS' ? 'text-green-600' : 'text-red-600'
                    }>
                      {log.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Show message if no logs */}
        {data.logs.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No audit logs found for the selected period.
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="mt-12 pt-4 border-t border-gray-300">
        <div className="flex justify-between items-center text-sm text-gray-600">
          <div className="text-center flex-1">
            <span className="font-semibold">Confidential - Internal Use Only</span>
          </div>
          <div>
            Page {currentPage} of {totalPages}
          </div>
        </div>
      </div>
    </div>
  );
}

// Example usage component with sample data
export function AuditReportExample() {
  const sampleData: AuditReportData = {
    reportId: "AUD-2025-001",
    period: "November 2025",
    generatedAt: new Date().toISOString(),
    summary: {
      totalActions: 1247,
      successRate: 97.3,
      failedCount: 34,
      uniqueUsers: 12
    },
    logs: [
      {
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        userEmail: "admin@steelsmart.com",
        action: "CREATE_PRODUCT",
        module: "INVENTORY",
        status: "SUCCESS"
      },
      {
        timestamp: new Date(Date.now() - 7200000).toISOString(),
        userEmail: "manager@steelsmart.com",
        action: "UPDATE_PRODUCT",
        module: "INVENTORY",
        status: "SUCCESS"
      },
      {
        timestamp: new Date(Date.now() - 10800000).toISOString(),
        userEmail: "user@steelsmart.com",
        action: "DELETE_REPORT",
        module: "REPORTS",
        status: "FAILED"
      },
      {
        timestamp: new Date(Date.now() - 14400000).toISOString(),
        userEmail: "admin@steelsmart.com",
        action: "LOGIN",
        module: "AUTH",
        status: "SUCCESS"
      },
      {
        timestamp: new Date(Date.now() - 18000000).toISOString(),
        userEmail: "analyst@steelsmart.com",
        action: "GENERATE_REPORT",
        module: "REPORTS",
        status: "SUCCESS"
      }
    ]
  };

  return <AuditReportDesign data={sampleData} currentPage={1} totalPages={3} />;
}