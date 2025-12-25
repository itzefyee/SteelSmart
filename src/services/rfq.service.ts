/**
 * RFQ Service Layer
 * 
 * Business logic for RFQ operations.
 * Note: RFQ operations are user-specific and don't benefit much from caching
 * since each user has their own data. Direct repository access is used.
 */

import { RFQRepository, RFQCreateInput, RFQSubmissionRow } from '@/repositories/rfq.repository';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/database.types';

export interface RFQContactInfo {
  name: string;
  email: string;
  company?: string;
  phone?: string;
}

export interface RFQRequirements {
  projectDescription: string;
  quantity: number;
  material?: string;
  specifications: string;
  deadline?: string;
  budget?: string;
}

export interface RFQSubmitResult {
  rfqId: string;
  status: string;
}

export class RFQService {
  private repository: RFQRepository;

  constructor(repository: RFQRepository) {
    this.repository = repository;
  }

  /**
   * Submit an RFQ request
   */
  async submitRFQ(
    userId: string,
    contact: RFQContactInfo,
    requirements: RFQRequirements,
    attachedFiles: string[]
  ): Promise<RFQSubmitResult> {
    // Validate inputs
    RFQService.validateContactInfo(contact);
    RFQService.validateRequirements(requirements);

    const input: RFQCreateInput = {
      user_id: userId,
      contact_name: contact.name,
      contact_email: contact.email,
      contact_company: contact.company ?? null,
      contact_phone: contact.phone ?? null,
      project_description: requirements.projectDescription,
      quantity: requirements.quantity,
      material: requirements.material ?? null,
      specifications: requirements.specifications,
      deadline: requirements.deadline ?? null,
      budget: requirements.budget ?? null,
      attached_files: attachedFiles,
      status: 'pending',
    };

    const result = await this.repository.create(input);

    return {
      rfqId: result.id,
      status: result.status ?? 'pending',
    };
  }

  /**
   * List RFQs for a specific user
   */
  async listForUser(userId: string): Promise<RFQSubmissionRow[]> {
    return this.repository.findByUserId(userId);
  }

  /**
   * Validate contact information
   */
  static validateContactInfo(contact: RFQContactInfo): void {
    if (!contact.name || contact.name.trim().length === 0) {
      throw new Error('Contact name is required');
    }
    
    if (!contact.email || !this.isValidEmail(contact.email)) {
      throw new Error('Valid email is required');
    }
  }
  
  /**
   * Validate requirements
   */
  static validateRequirements(requirements: RFQRequirements): void {
    if (!requirements.projectDescription || requirements.projectDescription.trim().length === 0) {
      throw new Error('Project description is required');
    }
    
    if (!requirements.quantity || requirements.quantity <= 0) {
      throw new Error('Quantity must be greater than 0');
    }
  }
  
  /**
   * Validate email format
   */
  private static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}
