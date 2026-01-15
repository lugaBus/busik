import { IsString, IsOptional, IsObject } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateProofSubmissionDto {
  @ApiPropertyOptional({ description: 'Content creator ID (required if contentCreatorSubmissionId is not provided)' })
  @IsOptional()
  @IsString()
  contentCreatorId?: string;

  @ApiPropertyOptional({ description: 'Content creator submission ID (required if contentCreatorId is not provided)' })
  @IsOptional()
  @IsString()
  contentCreatorSubmissionId?: string;

  @ApiPropertyOptional({ description: 'URL to proof source' })
  @IsOptional()
  @IsString()
  url?: string;

  @ApiPropertyOptional({ description: 'Image URL' })
  @IsOptional()
  @IsString()
  imageUrl?: string;

  @ApiPropertyOptional({ 
    description: 'Description in current language only (e.g., { ua: "текст" } or { en: "text" })',
    example: { ua: 'Опис пруфу' }
  })
  @IsOptional()
  @IsObject()
  description?: Record<string, string>;
}
