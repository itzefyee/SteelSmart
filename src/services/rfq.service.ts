import type { RFQSubmissionRow } from '@/repositories/rfq.repository';
import { RFQRepository, type RFQCreateInput } from '@/repositories/rfq.repository';
import { parseDeadlineToDate } from '@/lib/deadline-utils';

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

export interface RFQSubmissionResult {
  rfqId: string;
}

export class RFQService {
  constructor(private readonly repository: RFQRepository) {}

  async submitRFQ(
    userId: string,
    contact: RFQContactInfo,
    requirements: RFQRequirements,
    attachedFiles: string[],
  ): Promise<RFQSubmissionResult> {
    const input: RFQCreateInput = {
      user_id: userId,
      contact_name: contact.name,
      contact_email: contact.email,
      contact_company: contact.company || null,
      contact_phone: contact.phone || null,
      project_description: requirements.projectDescription,
      quantity: requirements.quantity,
      material: requirements.material || null,
      specifications: requirements.specifications,
      deadline: requirements.deadline ? parseDeadlineToDate(requirements.deadline) : null,
      budget: requirements.budget || null,
      attached_files: attachedFiles,
      status: 'pending',
    };

    const created = await this.repository.create(input);
    return { rfqId: created.id };
  }

  async listForUser(userId: string): Promise<RFQSubmissionRow[]> {
    return this.repository.findByUserId(userId);
  }
}


