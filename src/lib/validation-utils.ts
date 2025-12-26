import { ValidationError } from '@/lib/errors/app-errors';

/**
 * Validation utilities for consistent error handling across services
 */

export function validateRequired(value: string | undefined | null, fieldName: string): void {
  if (!value || value.trim().length === 0) {
    throw new ValidationError(`${fieldName} is required`, { 
      [fieldName.toLowerCase()]: `${fieldName} is required` 
    });
  }
}

export function validatePositiveNumber(value: number | undefined | null, fieldName: string): void {
  if (value === undefined || value === null || value < 0) {
    throw new ValidationError(`${fieldName} must be positive`, { 
      [fieldName.toLowerCase()]: `${fieldName} must be positive` 
    });
  }
}