import { IsString, IsOptional, ValidateNested, IsUrl } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { I18nDto } from './i18n.dto';

export class CreateContentCreatorPlatformDto {
  @ApiProperty({ example: 'platform-id-123' })
  @IsString()
  platformId: string;

  @ApiProperty({ example: 'https://youtube.com/@channel' })
  @IsString()
  @IsUrl()
  url: string;

  @ApiPropertyOptional({ 
    type: I18nDto,
    example: { en: 'Description', ua: 'Опис', ru: 'Описание' }
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => I18nDto)
  description?: I18nDto;
}
