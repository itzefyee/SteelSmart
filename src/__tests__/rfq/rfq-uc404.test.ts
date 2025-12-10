/**
 * UC404: Track RFQ status
 */

import { describe, it, expect, vi } from 'vitest';
import { RFQService } from '@/services/rfq.service';
import type { RFQSubmissionRow } from '@/repositories/rfq.repository';

describe('UC404: Track RFQ status', () => {
  const userId = 'user-123';

  it('TC_RFQ_UC404_001: should list RFQs for a specific user', async () => {
    const rfqRows: RFQSubmissionRow[] = [
      {
        id: 'rfq-001',
        user_id: userId,
        contact_name: 'Jane Doe',
        contact_email: 'jane@example.com',
        contact_company: 'Acme Steel',
        contact_phone: '+123456789',
        project_description: 'Custom steel beam for factory extension',
        quantity: 10,
        material: 'S355',
        specifications: 'Length 6m, IPE 200 profile, galvanized finish',
        deadline: '2025-12-31',
        budget: '5000',
        attached_files: [],
        status: 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ];

    const findByUserIdMock = vi.fn().mockResolvedValue(rfqRows);

    const fakeRepository = {
      create: vi.fn(),
      findByUserId: findByUserIdMock,
    } as unknown as {
      findByUserId: (userId: string) => Promise<RFQSubmissionRow[]>;
    };

    const service = new RFQService(fakeRepository as any);

    const result = await service.listForUser(userId);

    expect(findByUserIdMock).toHaveBeenCalledWith(userId);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('rfq-001');
    expect(result[0].status).toBe('pending');
  });
});


