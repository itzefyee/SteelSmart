/**
 * RFQ Service Layer
 * 
 * Business logic for RFQ operations.
 * Note: RFQ operations are user-specific and don't benefit much from caching
 * since each user has their own data. Direct repository access is used.
 */

import { RFQRepository, RFQCreateInput } from '@/repositories/rfq.repository';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/database.types';

export class RFQService {
  /**
   * Validate contact information
   */
  static validateContactInfo(contact: {
    name: string;
    email: string;
    company?: string;
    phone?: string;
  }): void {
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
  static validateRequirements(requirements: {
    projectDescription: string;
    quantity: number;
    material?: string;
    specifications: string;
    deadline?: string;
    budget?: string;
  }): void {
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
