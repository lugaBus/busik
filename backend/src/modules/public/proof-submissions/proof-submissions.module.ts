import { Module, forwardRef } from '@nestjs/common';
import { ProofSubmissionsController } from './proof-submissions.controller';
import { ProofSubmissionService } from './services/proof-submission.service';
import { AnonymousSessionService } from './services/anonymous-session.service';
import { ProofSubmissionRepository } from './repositories/proof-submission.repository';
import { ContentCreatorsModule } from '../../admin/content-creators/content-creators.module';

@Module({
  imports: [forwardRef(() => ContentCreatorsModule)],
  controllers: [ProofSubmissionsController],
  providers: [
    ProofSubmissionService,
    AnonymousSessionService,
    ProofSubmissionRepository,
  ],
  exports: [ProofSubmissionService],
})
export class ProofSubmissionsModule {}
