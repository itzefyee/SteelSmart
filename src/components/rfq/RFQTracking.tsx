'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { useRFQList } from '@/hooks/useRFQ';
import type { RFQ } from '@/lib/api/rfq-api';

const RFQTracking: React.FC = () => {
  // Use React Query hook for RFQ list with automatic caching
  const { data: rfqs = [], isLoading: loading, error: queryError, refetch } = useRFQList();
  const error = queryError?.message || '';
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedRFQ, setSelectedRFQ] = useState<RFQ | null>(null);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Submitted':
        return 'bg-blue-100 text-blue-800';
      case 'In Review':
        return 'bg-yellow-100 text-yellow-800';
      case 'Approved':
        return 'bg-green-100 text-green-800';
      case 'Rejected':
        return 'bg-red-100 text-red-800';
      case 'Completed':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'High':
        return 'text-red-600';
      case 'Medium':
        return 'text-yellow-600';
      case 'Low':
        return 'text-green-600';
      default:
        return 'text-gray-600';
    }
  };

  const filteredRFQs = rfqs.filter(rfq => {
    const matchesSearch = rfq.drawing.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         rfq.id.includes(searchTerm);
    const matchesStatus = statusFilter === 'all' || rfq.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getProgressPercentage = (status: string) => {
    switch (status) {
      case 'Submitted': return 25;
      case 'In Review': return 50;
      case 'Approved': return 75;
      case 'Completed': return 100;
      case 'Rejected': return 100;
      default: return 0;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">RFQ Tracking</h2>
          <p className="text-gray-600">Monitor the status of your quote requests</p>
        </div>
        <Button onClick={() => window.location.href = '/rfq'}>
          Create New RFQ
        </Button>
      </div>

      {/* Filters */}
      <div className="glass-container glass-container-with-liquid-compact p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input
            label="Search RFQs"
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="Search by drawing name or RFQ ID..."
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Filter by Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="all">All Statuses</option>
              <option value="Submitted">Submitted</option>
              <option value="In Review">In Review</option>
              <option value="Approved">Approved</option>
              <option value="Rejected">Rejected</option>
              <option value="Completed">Completed</option>
            </select>
          </div>
          <div className="flex items-end">
            <Button
              onClick={() => refetch()}
              variant="outline"
              disabled={loading}
              className="w-full"
            >
              {loading ? <LoadingSpinner size="sm" /> : 'Refresh'}
            </Button>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-red-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-red-800">{error}</span>
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="glass-container glass-container-with-liquid p-12">
          <div className="flex flex-col items-center justify-center">
            <LoadingSpinner size="lg" />
            <p className="text-gray-600 mt-4">Loading your RFQs...</p>
          </div>
        </div>
      )}

      {/* RFQ List */}
      {!loading && (
        <div className="glass-container glass-container-with-liquid p-6">
          {filteredRFQs.length > 0 ? (
          <div className="space-y-4">
            {filteredRFQs.map((rfq) => (
              <div key={rfq.id} className="glass-card p-6">
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                  {/* RFQ Details */}
                  <div className="md:col-span-1">
                    <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
                      RFQ Details
                    </div>
                    <div className="text-sm font-medium text-gray-900">
                      RFQ #{rfq.id.slice(-8).toUpperCase()}
                    </div>
                    <div className="text-sm text-gray-600">{rfq.drawing}</div>
                    <div className="text-xs text-gray-500 mt-1">Qty: {rfq.quantity}</div>
                  </div>

                  {/* Status */}
                  <div className="md:col-span-1">
                    <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
                      Status
                    </div>
                    <div className="flex flex-col space-y-2">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(rfq.status)} w-fit`}>
                        {rfq.status}
                      </span>
                      <span className={`text-xs font-medium ${getPriorityColor(rfq.priority)}`}>
                        Priority: {rfq.priority}
                      </span>
                    </div>
                  </div>

                  {/* Progress */}
                  <div className="md:col-span-1">
                    <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
                      Progress
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${
                          rfq.status === 'Rejected' ? 'bg-red-500' : 'bg-blue-500'
                        }`}
                        style={{ width: `${getProgressPercentage(rfq.status)}%` }}
                      ></div>
                    </div>
                    <div className="text-xs text-gray-600 mt-1">
                      {getProgressPercentage(rfq.status)}% Complete
                    </div>
                  </div>

                  {/* Dates */}
                  <div className="md:col-span-1">
                    <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
                      Dates
                    </div>
                    <div className="text-sm text-gray-600">
                      <div>Submitted: {rfq.submittedDate}</div>
                      <div>Expected: {rfq.expectedDelivery}</div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="md:col-span-1 flex items-end">
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => setSelectedRFQ(rfq)}
                      className="w-full"
                    >
                      View Details
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <svg className="w-12 h-12 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No RFQs Found</h3>
            <p className="text-gray-600 mb-4">
              {searchTerm || statusFilter !== 'all' 
                ? 'No RFQs match your current filters.' 
                : 'You haven\'t submitted any RFQs yet.'}
            </p>
            <Button onClick={() => window.location.href = '/rfq'}>
              Create Your First RFQ
            </Button>
          </div>
        )}
        </div>
      )}

      {/* RFQ Details Modal */}
      {selectedRFQ && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start sm:items-center justify-center p-4 sm:p-6 z-50">
          <div className="glass-container glass-container-with-liquid max-w-2xl w-full max-h-[85vh] overflow-y-auto">
            <div className="sticky top-0 bg-white/80 backdrop-blur px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">
                  RFQ #{selectedRFQ.id.slice(-8).toUpperCase()} Details
                </h3>
                <button
                  onClick={() => setSelectedRFQ(null)}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Status Timeline */}
              <div>
                <h4 className="font-medium text-gray-900 mb-4">Progress Timeline</h4>
                <div className="space-y-3">
                  {['Submitted', 'In Review', 'Approved', 'Completed'].map((status, index) => {
                    const isActive = ['Submitted', 'In Review', 'Approved', 'Completed'].indexOf(selectedRFQ.status) >= index;
                    const isCurrent = selectedRFQ.status === status;
                    
                    return (
                      <div key={status} className="flex items-center space-x-3">
                        <div className={`w-4 h-4 rounded-full flex items-center justify-center ${
                          isActive ? 'bg-blue-500' : 'bg-gray-300'
                        }`}>
                          {isActive && (
                            <div className="w-2 h-2 bg-white rounded-full"></div>
                          )}
                        </div>
                        <span className={`text-sm ${isCurrent ? 'font-medium text-blue-600' : 'text-gray-600'}`}>
                          {status}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Contact Information */}
              {selectedRFQ.contactInfo && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Contact Information</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-gray-700">Name:</span>
                      <p className="text-gray-900">{selectedRFQ.contactInfo.name}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Email:</span>
                      <p className="text-gray-900">{selectedRFQ.contactInfo.email}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Company:</span>
                      <p className="text-gray-900">{selectedRFQ.contactInfo.company}</p>
                    </div>
                    {selectedRFQ.contactInfo.phone && (
                      <div>
                        <span className="font-medium text-gray-700">Phone:</span>
                        <p className="text-gray-900">{selectedRFQ.contactInfo.phone}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Project Requirements */}
              {selectedRFQ.requirements && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Project Requirements</h4>
                  <div className="space-y-3 text-sm">
                    <div>
                      <span className="font-medium text-gray-700">Description:</span>
                      <p className="text-gray-900 mt-1">{selectedRFQ.requirements.projectDescription}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="font-medium text-gray-700">Quantity:</span>
                        <p className="text-gray-900">{selectedRFQ.requirements.quantity}</p>
                      </div>
                      {selectedRFQ.requirements.material && (
                        <div>
                          <span className="font-medium text-gray-700">Material:</span>
                          <p className="text-gray-900">{selectedRFQ.requirements.material}</p>
                        </div>
                      )}
                      {selectedRFQ.requirements.deadline && (
                        <div>
                          <span className="font-medium text-gray-700">Deadline:</span>
                          <p className="text-gray-900">{selectedRFQ.requirements.deadline}</p>
                        </div>
                      )}
                      {selectedRFQ.requirements.budget && (
                        <div>
                          <span className="font-medium text-gray-700">Budget:</span>
                          <p className="text-gray-900">{selectedRFQ.requirements.budget}</p>
                        </div>
                      )}
                    </div>
                    {selectedRFQ.requirements.specifications && (
                      <div>
                        <span className="font-medium text-gray-700">Specifications:</span>
                        <p className="text-gray-900 mt-1">{selectedRFQ.requirements.specifications}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* RFQ Summary */}
              <div>
                <h4 className="font-medium text-gray-900 mb-3">RFQ Summary</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-700">RFQ ID:</span>
                    <p className="text-gray-900">#{selectedRFQ.id.slice(-8).toUpperCase()}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Priority:</span>
                    <p className={`font-medium ${getPriorityColor(selectedRFQ.priority)}`}>
                      {selectedRFQ.priority}
                    </p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Status:</span>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(selectedRFQ.status)}`}>
                      {selectedRFQ.status}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Submitted:</span>
                    <p className="text-gray-900">{selectedRFQ.submittedDate}</p>
                  </div>
                </div>
              </div>

              {/* Attached Files */}
              {selectedRFQ.attachedFiles && selectedRFQ.attachedFiles.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Attached Files</h4>
                  <div className="space-y-2">
                    {selectedRFQ.attachedFiles.map((filePath, index) => (
                      <div key={index} className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                        <div className="flex items-center">
                          <svg className="w-5 h-5 text-gray-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          <span className="text-sm text-gray-900">{filePath.split('/').pop()}</span>
                        </div>
                        <Button size="sm" variant="outline">
                          Download
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex space-x-3 pt-4 border-t border-gray-200">
                <Button variant="outline" className="flex-1">
                  Download Quote
                </Button>
                <Button variant="outline" className="flex-1">
                  Contact Support
                </Button>
                <Button 
                  className="flex-1"
                  onClick={() => {
                    // Navigate to create new RFQ
                    window.location.href = '/rfq';
                  }}
                >
                  Create New RFQ
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RFQTracking;
