import { Module } from '@nestjs/common';
import { PublicController } from './public.controller';
import { PublicAuthController } from './auth/auth.controller';
import { PublicUsersController } from './users/users.controller';
import { PublicContentController } from './content/content.controller';
import { ContentCreatorsModule } from '../admin/content-creators/content-creators.module';
import { CategoriesModule } from '../admin/categories/categories.module';
import { RatiosModule } from '../admin/ratios/ratios.module';
import { ProofSubmissionsModule } from './proof-submissions/proof-submissions.module';
import { ContentCreatorSubmissionsModule } from './content-creator-submissions/content-creator-submissions.module';

@Module({
  imports: [
    ContentCreatorsModule,
    CategoriesModule,
    RatiosModule,
    ProofSubmissionsModule,
    ContentCreatorSubmissionsModule,
  ],
  controllers: [
    PublicController,
    PublicAuthController,
    PublicUsersController,
    PublicContentController,
  ],
  providers: [],
})
export class PublicModule {}
