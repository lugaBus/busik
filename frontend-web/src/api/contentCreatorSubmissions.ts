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

export interface CreateContentCreatorSubmissionDto {
  name: I18nText;
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

export interface UpdateContentCreatorSubmissionDto extends Partial<CreateContentCreatorSubmissionDto> {}

export const contentCreatorSubmissionsApi = {
  /**
   * Get or generate submitter ID for anonymous sessions
   */
  async getOrGenerateSubmitterId(): Promise<string> {
    const stored = localStorage.getItem('submitterId');
    if (stored) {
      return stored;
    }

    // Generate new submitter ID from server
    const response = await apiClient.post('/public/content-creator-submissions/anonymous-session');
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
   * Create a content creator submission
   * If user is authenticated, token will be sent automatically via interceptor
   * Only send submitterId if user is NOT authenticated (to avoid confusion on backend)
   */
  async create(data: CreateContentCreatorSubmissionDto, language?: string): Promise<ContentCreatorSubmission> {
    const isAuthenticated = typeof window !== 'undefined' && !!localStorage.getItem('token');
    const headers: Record<string, string> = {};
    
    // Only send submitterId if user is NOT authenticated
    // If authenticated, backend will use userId from token
    if (!isAuthenticated) {
      const submitterId = await this.getOrGenerateSubmitterId();
      headers['x-submitter-id'] = submitterId;
    }
    
    if (language) {
      headers['x-language'] = language;
    }
    
    console.log('[ContentCreatorSubmissionsApi CREATE]', {
      isAuthenticated,
      hasSubmitterId: !!headers['x-submitter-id'],
      hasToken: isAuthenticated,
    });
    
    const response = await apiClient.post('/public/content-creator-submissions', data, {
      headers,
    });
    return response.data;
  },

  /**
   * Get all content creator submissions for current user/submitter
   */
  async getAll(): Promise<ContentCreatorSubmission[]> {
    const submitterId = this.getSubmitterId();
    const config: any = {};
    if (submitterId) {
      config.headers = {
        'x-submitter-id': submitterId,
      };
    }
    const response = await apiClient.get('/public/content-creator-submissions', config);
    return response.data;
  },

  /**
   * Get a content creator submission by ID
   */
  async getById(id: string): Promise<ContentCreatorSubmission> {
    const submitterId = this.getSubmitterId();
    const config: any = {};
    if (submitterId) {
      config.headers = {
        'x-submitter-id': submitterId,
      };
    }
    const response = await apiClient.get(`/public/content-creator-submissions/${id}`, config);
    return response.data;
  },

  /**
   * Update a content creator submission
   */
  async update(id: string, data: UpdateContentCreatorSubmissionDto): Promise<ContentCreatorSubmission> {
    const submitterId = await this.getOrGenerateSubmitterId();
    const response = await apiClient.patch(`/public/content-creator-submissions/${id}`, data, {
      headers: {
        'x-submitter-id': submitterId,
      },
    });
    return response.data;
  },

  /**
   * Delete a content creator submission
   */
  async delete(id: string): Promise<void> {
    const submitterId = await this.getOrGenerateSubmitterId();
    await apiClient.delete(`/public/content-creator-submissions/${id}`, {
      headers: {
        'x-submitter-id': submitterId,
      },
    });
  },

  /**
   * Upload photo for content creator submission
   */
  async uploadPhoto(id: string, file: File, index?: number): Promise<ContentCreatorSubmission> {
    const submitterId = await this.getOrGenerateSubmitterId();
    const formData = new FormData();
    formData.append('file', file);
    if (index !== undefined) {
      formData.append('index', String(index));
    }
    const response = await apiClient.post(
      `/public/content-creator-submissions/${id}/photo`,
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
