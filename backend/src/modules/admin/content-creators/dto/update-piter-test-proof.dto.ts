import { PartialType } from '@nestjs/swagger';
import { CreatePiterTestProofDto } from './create-piter-test-proof.dto';

export class UpdatePiterTestProofDto extends PartialType(CreatePiterTestProofDto) {}
