import { Module, forwardRef } from '@nestjs/common';
import { ContentCreatorsController } from './content-creators.controller';
import { ContentCreatorService } from './services/content-creator.service';
import { ContentCreatorRepository } from './repositories/content-creator.repository';
import { ProofService } from './services/proof.service';
import { FullTextSearchService } from './services/implementations/full-text-search.service';
import { SharedModule } from '../../shared/shared.module';
import { InfrastructureModule } from '../../../infrastructure/infrastructure.module';
import { ProofSubmissionsModule } from '../../public/proof-submissions/proof-submissions.module';
import { ContentCreatorSubmissionsModule } from '../../public/content-creator-submissions/content-creator-submissions.module';

@Module({
  imports: [
    SharedModule,
    InfrastructureModule,
    forwardRef(() => ProofSubmissionsModule),
    forwardRef(() => ContentCreatorSubmissionsModule),
  ],
  controllers: [ContentCreatorsController],
  providers: [
    ContentCreatorService,
    ContentCreatorRepository,
    ProofService,
    {
      provide: 'IContentCreatorSearchService',
      useClass: FullTextSearchService,
    },
  ],
  exports: [ContentCreatorService],
})
export class ContentCreatorsModule {}
