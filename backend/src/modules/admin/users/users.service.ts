import { Injectable, NotFoundException } from '@nestjs/common';
import { UserRepository } from '../../shared/repositories/user.repository';
import { BlockUserDto } from './dto/block-user.dto';
import { DeleteUserDto } from './dto/delete-user.dto';

@Injectable()
export class AdminUsersService {
  constructor(private userRepository: UserRepository) {}

  async findAll(params?: {
    page?: number;
    limit?: number;
    search?: string;
    isActive?: boolean;
  }) {
    const page = params?.page || 1;
    const limit = params?.limit || 10;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (params?.search) {
      where.OR = [
        { email: { contains: params.search, mode: 'insensitive' } },
        { firstName: { contains: params.search, mode: 'insensitive' } },
        { lastName: { contains: params.search, mode: 'insensitive' } },
      ];
    }
    if (params?.isActive !== undefined) {
      where.isActive = params.isActive;
    }

    const [data, total] = await Promise.all([
      this.userRepository.findAll({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.userRepository.count(where),
    ]);

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    // Remove password from response
    const { password, ...result } = user;
    return result;
  }

  async blockUser(id: string, blockDto: BlockUserDto) {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return this.userRepository.update(id, {
      isActive: false,
      blockReason: blockDto.blockReason || null,
    });
  }

  async unblockUser(id: string) {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return this.userRepository.update(id, {
      isActive: true,
      blockReason: null,
    });
  }

  async deleteUser(id: string, deleteDto: DeleteUserDto) {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    // Store delete reason before deletion (if provided)
    if (deleteDto.deleteReason) {
      await this.userRepository.update(id, {
        deleteReason: deleteDto.deleteReason,
      });
    }

    // Note: In a real application, you might want to soft delete instead
    return this.userRepository.delete(id);
  }
}
