import { Module, forwardRef } from '@nestjs/common';
import { ContentCreatorSubmissionsController } from './content-creator-submissions.controller';
import { ContentCreatorSubmissionService } from './services/content-creator-submission.service';
import { AnonymousSessionService } from './services/anonymous-session.service';
import { ContentCreatorSubmissionRepository } from './repositories/content-creator-submission.repository';
import { ContentCreatorsModule } from '../../admin/content-creators/content-creators.module';

@Module({
  imports: [forwardRef(() => ContentCreatorsModule)],
  controllers: [ContentCreatorSubmissionsController],
  providers: [
    ContentCreatorSubmissionService,
    AnonymousSessionService,
    ContentCreatorSubmissionRepository,
  ],
  exports: [ContentCreatorSubmissionService],
})
export class ContentCreatorSubmissionsModule {}
