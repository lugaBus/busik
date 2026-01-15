import { Module, Global } from '@nestjs/common';
import { UserRepository } from './repositories/user.repository';
import { RoleRepository } from './repositories/role.repository';
import { PermissionRepository } from './repositories/permission.repository';
import { UserService } from './services/user.service';
import { RbacService } from './services/rbac.service';

@Global()
@Module({
  providers: [
    UserRepository,
    RoleRepository,
    PermissionRepository,
    UserService,
    RbacService,
  ],
  exports: [
    UserRepository,
    RoleRepository,
    PermissionRepository,
    UserService,
    RbacService,
  ],
})
export class SharedModule {}
