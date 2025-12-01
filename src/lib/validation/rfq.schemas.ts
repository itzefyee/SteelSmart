import { ValidationError } from '@/lib/errors/app-errors';

export interface RFQContact {
  name: string;
  email: string;
  company?: string | null;
  phone?: string | null;
}

export interface RFQRequirements {
  projectDescription: string;
  quantity: number;
  material?: string | null;
  specifications: string;
  deadline?: string | null;
  budget?: string | null;
}

export function validateRFQContact(input: RFQContact): RFQContact {
  if (!input.name || !input.email) {
    throw new ValidationError('Required fields are missing', ['name', 'email']);
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(input.email)) {
    throw new ValidationError('Invalid email address', ['email']);
  }

  return input;
}

export function validateRFQRequirements(input: RFQRequirements): RFQRequirements {
  if (!input.projectDescription || !input.specifications) {
    throw new ValidationError('Project description and specifications are required', [
      'projectDescription',
      'specifications',
    ]);
  }

  if (!Number.isInteger(input.quantity) || input.quantity < 1) {
    throw new ValidationError('Quantity must be a positive integer', ['quantity']);
  }

  return input;
}



