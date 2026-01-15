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
  currentStatus?: 'submitted' | 'in_review' | 'accepted' | 'declined' | null;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
  };
  anonymousSession?: {
    id: string;
    submitterId: string;
  };
  statusHistory?: Array<{
    id: string;
    status: string;
    reviewedById?: string;
    reviewedBy?: {
      id: string;
      email: string;
      firstName?: string;
      lastName?: string;
    };
    comment?: string;
    createdAt: string;
  }>;
}

export interface UpdateProofSubmissionStatusDto {
  status: 'submitted' | 'in_review' | 'accepted' | 'declined';
  comment?: string;
}

export interface UpdateProofSubmissionDto {
  url?: string;
  imageUrl?: string;
  description?: I18nText;
}

export const proofSubmissionsApi = {
  async getByCreator(contentCreatorId: string): Promise<ProofSubmission[]> {
    const response = await apiClient.get(`/admin/content-creators/${contentCreatorId}/proof-submissions`);
    return response.data;
  },

  async getByContentCreator(contentCreatorId?: string, contentCreatorSubmissionId?: string): Promise<ProofSubmission[]> {
    const config: any = {
      params: {},
    };
    if (contentCreatorId) {
      config.params.contentCreatorId = contentCreatorId;
    }
    if (contentCreatorSubmissionId) {
      config.params.contentCreatorSubmissionId = contentCreatorSubmissionId;
    }
    const response = await apiClient.get('/public/proof-submissions', config);
    return response.data;
  },

  async updateStatus(
    contentCreatorId: string,
    proofSubmissionId: string,
    data: UpdateProofSubmissionStatusDto
  ): Promise<ProofSubmission> {
    const response = await apiClient.patch(
      `/admin/content-creators/${contentCreatorId}/proof-submissions/${proofSubmissionId}/status`,
      data
    );
    return response.data;
  },

  async delete(contentCreatorId: string, proofSubmissionId: string): Promise<void> {
    await apiClient.delete(`/admin/content-creators/${contentCreatorId}/proof-submissions/${proofSubmissionId}`);
  },

  async deleteForAdmin(proofSubmissionId: string): Promise<void> {
    // For proof submissions linked to content creator submissions, we need to find the content creator ID first
    // For now, we'll use the public endpoint with admin auth
    await apiClient.delete(`/admin/proof-submissions/${proofSubmissionId}`);
  },

  async updateForSubmission(
    submissionId: string,
    proofSubmissionId: string,
    data: UpdateProofSubmissionDto
  ): Promise<ProofSubmission> {
    const response = await apiClient.patch(
      `/admin/content-creators/submissions/${submissionId}/proof-submissions/${proofSubmissionId}`,
      data
    );
    return response.data;
  },
};
