import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { Prisma } from '@prisma/client';
import { UserRepository, UserWithRoles } from '../repositories/user.repository';
import { CreateUserDto } from '../dto/create-user.dto';

@Injectable()
export class UserService {
  constructor(private userRepository: UserRepository) {}

  async create(createUserDto: CreateUserDto): Promise<any> {
    // Check if user already exists
    const existingUser = await this.userRepository.findByEmail(createUserDto.email);
    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
    try {
      const user = await this.userRepository.create({
        email: createUserDto.email,
        password: hashedPassword,
        firstName: createUserDto.firstName,
        lastName: createUserDto.lastName,
      });
      // Remove password from response
      const { password, ...result } = user;
      return result;
    } catch (error) {
      // Handle Prisma unique constraint violation
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new ConflictException('User with this email already exists');
        }
      }
      throw error;
    }
  }

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.userRepository.findByEmail(email);
    if (!user || !user.isActive) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const { password: _, ...result } = user;
    return result;
  }

  async findById(id: string): Promise<any> {
    const user = await this.userRepository.findById(id);
    if (!user) {
      return null;
    }
    const { password, ...result } = user;
    return result;
  }

  async findByIdWithRoles(id: string): Promise<UserWithRoles | null> {
    return this.userRepository.findByIdWithRoles(id);
  }

  async getUserPermissions(userId: string): Promise<string[]> {
    const user = await this.userRepository.findByIdWithRoles(userId);
    if (!user) {
      return [];
    }

    const permissions = new Set<string>();
    user.userRoles.forEach((userRole) => {
      userRole.role.rolePermissions.forEach((rolePermission) => {
        permissions.add(rolePermission.permission.name);
      });
    });

    return Array.from(permissions);
  }

  async getUserRoles(userId: string): Promise<string[]> {
    const user = await this.userRepository.findByIdWithRoles(userId);
    if (!user) {
      return [];
    }

    return user.userRoles.map((userRole) => userRole.role.name);
  }
}
