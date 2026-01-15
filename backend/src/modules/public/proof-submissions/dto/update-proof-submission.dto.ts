import { PartialType } from '@nestjs/swagger';
import { CreateProofSubmissionDto } from './create-proof-submission.dto';

export class UpdateProofSubmissionDto extends PartialType(CreateProofSubmissionDto) {}
