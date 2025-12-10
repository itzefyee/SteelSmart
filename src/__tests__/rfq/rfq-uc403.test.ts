/**
 * UC403: Submit RFQ form
 */

import { describe, it, expect, vi } from 'vitest';
import {
  RFQService,
  type RFQContactInfo,
  type RFQRequirements,
} from '@/services/rfq.service';
import type { RFQSubmissionRow, RFQCreateInput } from '@/repositories/rfq.repository';
import { validateRFQContact, validateRFQRequirements } from '@/lib/validation/rfq.schemas';
import { ValidationError } from '@/lib/errors/app-errors';

describe('UC403: Submit RFQ form', () => {
  const userId = 'user-123';

  const contact: RFQContactInfo = {
    name: 'Jane Doe',
    email: 'jane@example.com',
    company: 'Acme Steel',
    phone: '+123456789',
  };

  const requirements: RFQRequirements = {
    projectDescription: 'Factory extension beam order',
    quantity: 10,
    material: 'S355',
    specifications: 'IPE 200; galvanized; 6m length',
    deadline: '2025-11-01',
    budget: '5000',
  };

  it('TC_RFQ_UC403_001: should submit a valid RFQ successfully', async () => {
    const createMock = vi.fn<[], Promise<RFQSubmissionRow>>().mockResolvedValue({
      id: 'rfq-403-001',
      user_id: userId,
      contact_name: contact.name,
      contact_email: contact.email,
      contact_company: contact.company ?? null,
      contact_phone: contact.phone ?? null,
      project_description: requirements.projectDescription,
      quantity: requirements.quantity,
      material: requirements.material ?? null,
      specifications: requirements.specifications,
      deadline: new Date(requirements.deadline ?? ''),
      budget: requirements.budget ?? null,
      attached_files: [],
      status: 'pending',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    } as RFQSubmissionRow);

    const fakeRepository = {
      create: createMock,
      findByUserId: vi.fn(),
    } as unknown as {
      create: (input: RFQCreateInput) => Promise<RFQSubmissionRow>;
    };

    const service = new RFQService(fakeRepository as any);

    const result = await service.submitRFQ(userId, contact, requirements, []);

    expect(result.rfqId).toBe('rfq-403-001');
    expect(createMock).toHaveBeenCalledTimes(1);
  });

  it('TC_RFQ_UC403_002: should block invalid email before submission', () => {
    const badContact: RFQContactInfo = { ...contact, email: 'invalid-email' };
    expect(() => validateRFQContact(badContact)).toThrow(ValidationError);
  });

  it('TC_RFQ_UC403_003: should block missing required fields (projectDescription/specifications)', () => {
    const badReq: RFQRequirements = {
      ...requirements,
      projectDescription: '',
      specifications: '',
    };
    expect(() => validateRFQRequirements(badReq)).toThrow(ValidationError);
  });

  it('TC_RFQ_UC403_004: should surface repository errors on submit', async () => {
    const createMock = vi.fn().mockRejectedValue(new Error('DB failure'));

    const fakeRepository = {
      create: createMock,
      findByUserId: vi.fn(),
    } as unknown as {
      create: (input: RFQCreateInput) => Promise<RFQSubmissionRow>;
    };

    const service = new RFQService(fakeRepository as any);

    await expect(service.submitRFQ(userId, contact, requirements, [])).rejects.toThrow('DB failure');
  });
});



