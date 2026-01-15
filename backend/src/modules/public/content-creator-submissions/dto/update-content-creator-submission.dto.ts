import { PartialType } from '@nestjs/swagger';
import { CreateContentCreatorSubmissionDto } from './create-content-creator-submission.dto';

export class UpdateContentCreatorSubmissionDto extends PartialType(CreateContentCreatorSubmissionDto) {}
