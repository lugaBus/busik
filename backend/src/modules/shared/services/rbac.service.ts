import { Injectable } from '@nestjs/common';
import { RoleRepository } from '../repositories/role.repository';
import { PermissionRepository } from '../repositories/permission.repository';
import { UserRepository } from '../repositories/user.repository';

@Injectable()
export class RbacService {
  constructor(
    private roleRepository: RoleRepository,
    private permissionRepository: PermissionRepository,
    private userRepository: UserRepository,
  ) {}

  async userHasPermission(userId: string, permissionName: string): Promise<boolean> {
    const user = await this.userRepository.findByIdWithRoles(userId);
    if (!user) {
      return false;
    }

    for (const userRole of user.userRoles) {
      for (const rolePermission of userRole.role.rolePermissions) {
        if (rolePermission.permission.name === permissionName) {
          return true;
        }
      }
    }

    return false;
  }

  async userHasRole(userId: string, roleName: string): Promise<boolean> {
    const user = await this.userRepository.findByIdWithRoles(userId);
    if (!user) {
      return false;
    }

    return user.userRoles.some((userRole) => userRole.role.name === roleName);
  }

  async userHasAnyRole(userId: string, roleNames: string[]): Promise<boolean> {
    const user = await this.userRepository.findByIdWithRoles(userId);
    if (!user) {
      return false;
    }

    const userRoleNames = user.userRoles.map((ur) => ur.role.name);
    return roleNames.some((roleName) => userRoleNames.includes(roleName));
  }

  async userHasAnyPermission(
    userId: string,
    permissionNames: string[],
  ): Promise<boolean> {
    const user = await this.userRepository.findByIdWithRoles(userId);
    if (!user) {
      return false;
    }

    const userPermissions = new Set<string>();
    user.userRoles.forEach((userRole) => {
      userRole.role.rolePermissions.forEach((rp) => {
        userPermissions.add(rp.permission.name);
      });
    });

    return permissionNames.some((permissionName) =>
      userPermissions.has(permissionName),
    );
  }
}
