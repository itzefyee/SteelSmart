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

export function validateEmail(email: string | undefined | null, fieldName: string = 'Email'): void {
  if (!email || email.trim().length === 0) {
    throw new ValidationError(`${fieldName} is required`, { 
      [fieldName.toLowerCase()]: `${fieldName} is required` 
    });
  }
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new ValidationError(`${fieldName} must be valid`, { 
      [fieldName.toLowerCase()]: `${fieldName} must be valid` 
    });
  }
}

export function validateLength(
  value: string | undefined | null, 
  fieldName: string, 
  minLength: number, 
  maxLength?: number
): void {
  if (!value) {
    throw new ValidationError(`${fieldName} is required`, { 
      [fieldName.toLowerCase()]: `${fieldName} is required` 
    });
  }
  
  if (value.length < minLength) {
    throw new ValidationError(
      `${fieldName} must be at least ${minLength} characters`, 
      { [fieldName.toLowerCase()]: `${fieldName} must be at least ${minLength} characters` }
    );
  }
  
  if (maxLength && value.length > maxLength) {
    throw new ValidationError(
      `${fieldName} must be no more than ${maxLength} characters`, 
      { [fieldName.toLowerCase()]: `${fieldName} must be no more than ${maxLength} characters` }
    );
  }
}