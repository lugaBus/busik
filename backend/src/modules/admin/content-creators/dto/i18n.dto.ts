import { IsString, IsObject, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class I18nDto {
  @ApiProperty({ example: 'English text' })
  @IsString()
  en: string;

  @ApiProperty({ example: 'Український текст' })
  @IsString()
  ua: string;

  @ApiProperty({ example: 'Русский текст' })
  @IsString()
  ru: string;
}
