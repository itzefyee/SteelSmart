/**
 * UC401: Create RFQ request
 */

import { describe, it, expect, vi } from 'vitest';
import {
  RFQService,
  type RFQContactInfo,
  type RFQRequirements,
} from '@/services/rfq.service';
import type { RFQSubmissionRow, RFQCreateInput } from '@/repositories/rfq.repository';

describe('UC401: Create RFQ request', () => {
  const userId = 'user-123';

  const contact: RFQContactInfo = {
    name: 'Jane Doe',
    email: 'jane@example.com',
    company: 'Acme Steel',
    phone: '+123456789',
  };

  const requirements: RFQRequirements = {
    projectDescription: 'Custom steel beam for factory extension',
    quantity: 10,
    material: 'S355',
    specifications: 'Length 6m, IPE 200 profile, galvanized finish',
    deadline: '2025-12-31',
    budget: '5000',
  };

  it('TC_RFQ_UC401_001: should submit RFQ and map fields correctly', async () => {
    const attachedFiles = ['user-123/drawing1.pdf'];

    const createMock = vi.fn().mockResolvedValue({
      id: 'rfq-001',
      user_id: userId,
      contact_name: contact.name,
      contact_email: contact.email,
      contact_company: contact.company ?? null,
      contact_phone: contact.phone ?? null,
      project_description: requirements.projectDescription,
      quantity: requirements.quantity,
      material: requirements.material ?? null,
      specifications: requirements.specifications,
      deadline: '2025-12-31',
      budget: requirements.budget ?? null,
      attached_files: attachedFiles,
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

    const result = await service.submitRFQ(userId, contact, requirements, attachedFiles);

    expect(result.rfqId).toBe('rfq-001');
    expect(createMock).toHaveBeenCalledTimes(1);

    const createdInput = createMock.mock.calls[0][0] as RFQCreateInput;

    expect(createdInput.user_id).toBe(userId);
    expect(createdInput.contact_name).toBe(contact.name);
    expect(createdInput.contact_email).toBe(contact.email);
    expect(createdInput.project_description).toBe(requirements.projectDescription);
    expect(createdInput.quantity).toBe(requirements.quantity);
    expect(createdInput.material).toBe(requirements.material);
    expect(createdInput.specifications).toBe(requirements.specifications);
    expect(createdInput.attached_files).toEqual(attachedFiles);
    expect(createdInput.status).toBe('pending');
  });
});


