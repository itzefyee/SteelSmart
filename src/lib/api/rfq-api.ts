/**
 * RFQ API Client
 * 
 * Client-side API wrapper for RFQ operations.
 * Used by React Query hooks to fetch and mutate RFQ data.
 * 
 * Architecture:
 * Component → useRFQ hook → RFQAPI → HTTP → Controller → Service → Repository → Database
 */

export interface RFQContactInfo {
  name: string;
  email: string;
  company: string;
  phone?: string;
}

export interface RFQRequirements {
  projectDescription: string;
  quantity: number;
  material?: string;
  specifications?: string;
  deadline?: string;
  budget?: string;
}

export interface RFQFormData {
  contactInfo: RFQContactInfo;
  requirements: RFQRequirements;
  attachedFiles?: File[];
}

export interface RFQ {
  id: string;
  drawing: string;
  quantity: number;
  status: 'Submitted' | 'In Review' | 'Approved' | 'Rejected' | 'Completed';
  submittedDate: string;
  expectedDelivery: string;
  priority: 'Low' | 'Medium' | 'High';
  contactInfo?: RFQContactInfo;
  requirements?: RFQRequirements;
  attachedFiles?: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface RFQListResponse {
  success: boolean;
  data?: RFQ[];
  error?: string;
}

export interface RFQResponse {
  success: boolean;
  data?: RFQ;
  error?: string;
}

/**
 * RFQ API Client
 * 
 * Provides methods for RFQ CRUD operations.
 * All methods throw errors on failure for React Query error handling.
 */
export class RFQAPI {
  /**
   * Get list of RFQs for current user
   * 
   * @returns Array of RFQs
   * @throws Error if request fails
   */
  static async getList(): Promise<RFQ[]> {
    const response = await fetch('/api/rfq-list');
    const result: RFQListResponse = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to fetch RFQs');
    }
    
    return result.data || [];
  }
  
  /**
   * Get single RFQ by ID
   * 
   * @param id - RFQ ID
   * @returns RFQ object
   * @throws Error if request fails or RFQ not found
   */
  static async getById(id: string): Promise<RFQ> {
    const response = await fetch(`/api/rfq/${id}`);
    const result: RFQResponse = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to fetch RFQ');
    }
    
    if (!result.data) {
      throw new Error('RFQ not found');
    }
    
    return result.data;
  }
  
  /**
   * Submit new RFQ
   * 
   * @param data - RFQ form data including files
   * @returns Created RFQ object
   * @throws Error if submission fails
   */
  static async submit(data: RFQFormData): Promise<RFQ> {
    const formData = new FormData();
    
    // Add contact info and requirements as JSON strings
    formData.append('contactInfo', JSON.stringify(data.contactInfo));
    formData.append('requirements', JSON.stringify(data.requirements));
    
    // Add files if present
    if (data.attachedFiles && data.attachedFiles.length > 0) {
      data.attachedFiles.forEach((file, index) => {
        formData.append(`file_${index}`, file);
      });
    }
    
    const response = await fetch('/api/submit-rfq', {
      method: 'POST',
      body: formData,
    });
    
    const result: RFQResponse = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to submit RFQ');
    }
    
    if (!result.data) {
      throw new Error('No RFQ data returned');
    }
    
    return result.data;
  }
  
  /**
   * Update existing RFQ
   * 
   * @param id - RFQ ID
   * @param updates - Partial RFQ data to update
   * @returns Updated RFQ object
   * @throws Error if update fails
   */
  static async update(id: string, updates: Partial<RFQ>): Promise<RFQ> {
    const response = await fetch(`/api/rfq/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    
    const result: RFQResponse = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to update RFQ');
    }
    
    if (!result.data) {
      throw new Error('No RFQ data returned');
    }
    
    return result.data;
  }
  
  /**
   * Delete RFQ
   * 
   * @param id - RFQ ID
   * @throws Error if deletion fails
   */
  static async delete(id: string): Promise<void> {
    const response = await fetch(`/api/rfq/${id}`, {
      method: 'DELETE',
    });
    
    const result: RFQResponse = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to delete RFQ');
    }
  }
}
