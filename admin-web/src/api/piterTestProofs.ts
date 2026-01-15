import apiClient from './client';
import { I18nText } from '@/utils/i18n';

export interface PiterTestProof {
  id: string;
  contentCreatorId: string;
  url?: string;
  imageUrl?: string;
  description?: I18nText;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePiterTestProofDto {
  url?: string;
  imageUrl?: string;
  description?: I18nText;
}

export interface UpdatePiterTestProofDto extends Partial<CreatePiterTestProofDto> {}

export const piterTestProofsApi = {
  async getByCreator(contentCreatorId: string): Promise<PiterTestProof[]> {
    const response = await apiClient.get(`/admin/content-creators/${contentCreatorId}/piter-test-proofs`);
    return response.data;
  },

  async add(contentCreatorId: string, data: CreatePiterTestProofDto): Promise<PiterTestProof> {
    const response = await apiClient.post(`/admin/content-creators/${contentCreatorId}/piter-test-proofs`, data);
    return response.data;
  },

  async update(proofId: string, data: UpdatePiterTestProofDto): Promise<PiterTestProof> {
    const response = await apiClient.patch(`/admin/content-creators/piter-test-proofs/${proofId}`, data);
    return response.data;
  },

  async delete(proofId: string): Promise<void> {
    await apiClient.delete(`/admin/content-creators/piter-test-proofs/${proofId}`);
  },

  async uploadImage(proofId: string, file: File): Promise<PiterTestProof> {
    const formData = new FormData();
    formData.append('file', file);
    const response = await apiClient.post(`/admin/content-creators/piter-test-proofs/${proofId}/image`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
};
