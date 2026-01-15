import apiClient from './client';
import { I18nText } from '@/utils/i18n';

export interface ProofSubmission {
  id: string;
  contentCreatorId?: string;
  contentCreatorSubmissionId?: string;
  url?: string;
  imageUrl?: string;
  description?: I18nText;
  userId?: string;
  anonymousSessionId?: string;
  currentStatus?: 'submitted' | 'in_review' | 'accepted' | 'declined' | 'deleted_by_user' | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProofSubmissionDto {
  contentCreatorId?: string;
  contentCreatorSubmissionId?: string;
  url?: string;
  imageUrl?: string;
  description?: I18nText;
}

export interface UpdateProofSubmissionDto extends Partial<CreateProofSubmissionDto> {}

export const proofSubmissionsApi = {
  /**
   * Get or generate submitter ID for anonymous sessions
   */
  async getOrGenerateSubmitterId(): Promise<string> {
    const stored = localStorage.getItem('submitterId');
    if (stored) {
      return stored;
    }

    // Generate new submitter ID from server
    const response = await apiClient.post('/public/proof-submissions/anonymous-session');
    const { submitterId } = response.data;
    localStorage.setItem('submitterId', submitterId);
    return submitterId;
  },

  /**
   * Get submitter ID from storage
   */
  getSubmitterId(): string | null {
    return localStorage.getItem('submitterId');
  },

  /**
   * Create a proof submission
   */
  async create(data: CreateProofSubmissionDto, language?: string): Promise<ProofSubmission> {
    const submitterId = await this.getOrGenerateSubmitterId();
    const headers: Record<string, string> = {
      'x-submitter-id': submitterId,
    };
    if (language) {
      headers['x-language'] = language;
    }
    const response = await apiClient.post('/public/proof-submissions', data, {
      headers,
    });
    return response.data;
  },

  /**
   * Get all proof submissions for a content creator or submission
   */
  async getByContentCreator(contentCreatorId?: string, contentCreatorSubmissionId?: string): Promise<ProofSubmission[]> {
    const submitterId = this.getSubmitterId();
    const config: any = {
      params: {},
    };
    if (contentCreatorId) {
      config.params.contentCreatorId = contentCreatorId;
    }
    if (contentCreatorSubmissionId) {
      config.params.contentCreatorSubmissionId = contentCreatorSubmissionId;
    }
    if (submitterId) {
      config.headers = {
        'x-submitter-id': submitterId,
      };
    }
    const response = await apiClient.get('/public/proof-submissions', config);
    return response.data;
  },

  /**
   * Get a proof submission by ID
   */
  async getById(id: string): Promise<ProofSubmission> {
    const submitterId = this.getSubmitterId();
    const config: any = {};
    if (submitterId) {
      config.headers = {
        'x-submitter-id': submitterId,
      };
    }
    const response = await apiClient.get(`/public/proof-submissions/${id}`, config);
    return response.data;
  },

  /**
   * Update a proof submission
   */
  async update(id: string, data: UpdateProofSubmissionDto): Promise<ProofSubmission> {
    const submitterId = await this.getOrGenerateSubmitterId();
    const response = await apiClient.patch(`/public/proof-submissions/${id}`, data, {
      headers: {
        'x-submitter-id': submitterId,
      },
    });
    return response.data;
  },

  /**
   * Delete a proof submission
   */
  async delete(id: string): Promise<void> {
    const submitterId = await this.getOrGenerateSubmitterId();
    await apiClient.delete(`/public/proof-submissions/${id}`, {
      headers: {
        'x-submitter-id': submitterId,
      },
    });
  },

  /**
   * Upload image for proof submission
   */
  async uploadImage(id: string, file: File): Promise<ProofSubmission> {
    const submitterId = await this.getOrGenerateSubmitterId();
    const formData = new FormData();
    formData.append('file', file);
    const response = await apiClient.post(
      `/public/proof-submissions/${id}/image`,
      formData,
      {
        headers: {
          'x-submitter-id': submitterId,
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data;
  },
};
