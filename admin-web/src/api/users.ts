import apiClient from './client';

export interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  isActive: boolean;
  blockReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface BlockUserDto {
  blockReason?: string;
}

export interface DeleteUserDto {
  deleteReason?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export const usersApi = {
  async getAll(params?: {
    page?: number;
    limit?: number;
    search?: string;
    isActive?: boolean;
  }): Promise<PaginatedResponse<User>> {
    const response = await apiClient.get('/admin/users', { params });
    return response.data;
  },

  async getById(id: string): Promise<User> {
    const response = await apiClient.get(`/admin/users/${id}`);
    return response.data;
  },

  async blockUser(id: string, data: BlockUserDto): Promise<User> {
    const response = await apiClient.patch(`/admin/users/${id}/block`, data);
    return response.data;
  },

  async unblockUser(id: string): Promise<User> {
    const response = await apiClient.patch(`/admin/users/${id}/unblock`);
    return response.data;
  },

  async deleteUser(id: string, data: DeleteUserDto): Promise<void> {
    await apiClient.delete(`/admin/users/${id}`, { data });
  },
};
