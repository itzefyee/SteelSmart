/**
 * UC402: Auto-fill RFQ details
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  RFQService,
  type RFQContactInfo,
  type RFQRequirements,
} from '@/services/rfq.service';
import type { RFQSubmissionRow, RFQCreateInput } from '@/repositories/rfq.repository';

describe('UC402: Auto-fill RFQ details', () => {
  const userId = 'user-123';

  const baseContact: RFQContactInfo = {
    name: 'Alex Doe',
    email: 'alex@example.com',
    company: 'SteelSmart',
    phone: '+123456789',
  };

  const baseRequirements: RFQRequirements = {
    projectDescription: 'Auto-filled from drawing',
    quantity: 5,
    material: 'S355',
    specifications: 'Length 1200mm; flange 200mm; web 10mm',
    deadline: '2025-10-01',
    budget: '2500',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('TC_RFQ_UC402_001: should accept auto-filled fields from CAD drawing/product and submit', async () => {
    const attachedFiles = ['user-123/beam.step'];

    const createMock = vi.fn<[], Promise<RFQSubmissionRow>>().mockResolvedValue({
      id: 'rfq-402-001',
      user_id: userId,
      contact_name: baseContact.name,
      contact_email: baseContact.email,
      contact_company: baseContact.company ?? null,
      contact_phone: baseContact.phone ?? null,
      project_description: baseRequirements.projectDescription,
      quantity: baseRequirements.quantity,
      material: baseRequirements.material ?? null,
      specifications: baseRequirements.specifications,
      deadline: new Date(baseRequirements.deadline ?? ''),
      budget: baseRequirements.budget ?? null,
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

    const result = await service.submitRFQ(userId, baseContact, baseRequirements, attachedFiles);

    expect(result.rfqId).toBe('rfq-402-001');
    const created = createMock.mock.calls[0][0] as RFQCreateInput;
    expect(created.material).toBe('S355'); // auto-filled material propagated
    expect(created.specifications).toContain('Length 1200mm'); // auto-filled specs propagated
  });

  it('TC_RFQ_UC402_002: should allow user overrides of auto-filled values (quantity/deadline)', async () => {
    const overrides: RFQRequirements = {
      ...baseRequirements,
      quantity: 12, // user override
      deadline: '2025-12-15', // user override
    };

    const createMock = vi.fn<[], Promise<RFQSubmissionRow>>().mockResolvedValue({
      id: 'rfq-402-002',
      user_id: userId,
      contact_name: baseContact.name,
      contact_email: baseContact.email,
      contact_company: baseContact.company ?? null,
      contact_phone: baseContact.phone ?? null,
      project_description: overrides.projectDescription,
      quantity: overrides.quantity,
      material: overrides.material ?? null,
      specifications: overrides.specifications,
      deadline: new Date(overrides.deadline ?? ''),
      budget: overrides.budget ?? null,
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

    const result = await service.submitRFQ(userId, baseContact, overrides, []);

    expect(result.rfqId).toBe('rfq-402-002');
    const created = createMock.mock.calls[0][0] as RFQCreateInput;
    expect(created.quantity).toBe(12); // override respected
    expect(created.deadline).toBe('2025-12-15');
  });
});


