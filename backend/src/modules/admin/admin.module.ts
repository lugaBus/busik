import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminUsersController } from './users/users.controller';
import { AdminUsersService } from './users/users.service';
import { AdminRolesController } from './roles/roles.controller';
import { AdminAuditController } from './audit/audit.controller';
import { ContentCreatorsModule } from './content-creators/content-creators.module';
import { CategoriesModule } from './categories/categories.module';
import { TagsModule } from './tags/tags.module';
import { RatiosModule } from './ratios/ratios.module';
import { PlatformsModule } from './platforms/platforms.module';
import { SharedModule } from '../shared/shared.module';

@Module({
  imports: [SharedModule, ContentCreatorsModule, CategoriesModule, TagsModule, RatiosModule, PlatformsModule],
  controllers: [
    AdminController,
    AdminUsersController,
    AdminRolesController,
    AdminAuditController,
  ],
  providers: [AdminUsersService],
})
export class AdminModule {}
