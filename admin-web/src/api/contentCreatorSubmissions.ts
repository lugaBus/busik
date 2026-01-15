import apiClient from './client';
import { I18nText } from '@/utils/i18n';

export interface ContentCreatorSubmission {
  id: string;
  name: I18nText;
  quote?: I18nText;
  description?: I18nText;
  locale: string;
  mainLink?: string;
  photoUrls?: string[];
  rating?: number;
  contentFormats?: string[];
  tone?: number;
  audience?: Record<string, any>;
  metrics?: Record<string, any>;
  piterTest?: string;
  categoryIds?: string[];
  tagIds?: string[];
  ratioIds?: string[];
  platforms?: Array<{
    platformId: string;
    url: string;
    description?: I18nText;
  }>;
  userId?: string;
  anonymousSessionId?: string;
  currentStatus?: 'submitted' | 'in_review' | 'accepted' | 'declined' | 'deleted_by_user' | null;
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

export interface UpdateContentCreatorSubmissionStatusDto {
  status: 'submitted' | 'in_review' | 'accepted' | 'declined';
  comment?: string;
}

export interface UpdateContentCreatorSubmissionDto {
  name?: I18nText;
  quote?: I18nText;
  description?: I18nText;
  locale?: string;
  mainLink?: string;
  photoUrls?: string[];
  rating?: number;
  contentFormats?: string[];
  tone?: number;
  audience?: Record<string, any>;
  metrics?: Record<string, any>;
  piterTest?: string;
  categoryIds?: string[];
  tagIds?: string[];
  ratioIds?: string[];
  platforms?: Array<{
    platformId: string;
    url: string;
    description?: I18nText;
  }>;
}

export const contentCreatorSubmissionsApi = {
  async getAll(): Promise<ContentCreatorSubmission[]> {
    const response = await apiClient.get('/admin/content-creators/submissions');
    return response.data;
  },

  async getById(submissionId: string): Promise<ContentCreatorSubmission> {
    const response = await apiClient.get(`/admin/content-creators/submissions/${submissionId}`);
    return response.data;
  },

  async update(
    submissionId: string,
    data: UpdateContentCreatorSubmissionDto
  ): Promise<ContentCreatorSubmission> {
    const response = await apiClient.patch(
      `/admin/content-creators/submissions/${submissionId}`,
      data
    );
    return response.data;
  },

  async updateStatus(
    submissionId: string,
    data: UpdateContentCreatorSubmissionStatusDto
  ): Promise<ContentCreatorSubmission> {
    const response = await apiClient.patch(
      `/admin/content-creators/submissions/${submissionId}/status`,
      data
    );
    return response.data;
  },

  async delete(submissionId: string): Promise<void> {
    await apiClient.delete(`/admin/content-creators/submissions/${submissionId}`);
  },

  async addPhoto(submissionId: string, file: File): Promise<ContentCreatorSubmission> {
    const formData = new FormData();
    formData.append('file', file);
    const response = await apiClient.post(
      `/admin/content-creators/submissions/${submissionId}/photo`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data;
  },

  async removePhoto(submissionId: string, photoIndex: number): Promise<void> {
    await apiClient.delete(`/admin/content-creators/submissions/${submissionId}/photo/${photoIndex}`);
  },
};
