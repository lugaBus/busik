import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateProofSubmissionStatusDto {
  @ApiProperty({ enum: ['submitted', 'in_review', 'accepted', 'declined'], description: 'Note: deleted_by_user status cannot be set manually' })
  @IsEnum(['submitted', 'in_review', 'accepted', 'declined'])
  status: 'submitted' | 'in_review' | 'accepted' | 'declined';

  @ApiPropertyOptional({ description: 'Optional comment from reviewer' })
  @IsOptional()
  @IsString()
  comment?: string;
}
