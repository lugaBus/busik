import {
  IsString,
  IsOptional,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { I18nDto } from '../../content-creators/dto/i18n.dto';

export class CreatePlatformDto {
  @ApiProperty({ 
    type: I18nDto,
    example: { en: 'YouTube', ua: 'YouTube', ru: 'YouTube' }
  })
  @ValidateNested()
  @Type(() => I18nDto)
  name: I18nDto;

  @ApiPropertyOptional({ example: 'youtube' })
  @IsOptional()
  @IsString()
  slug?: string;

  @ApiPropertyOptional({ 
    type: I18nDto,
    example: { en: 'Description', ua: 'Опис', ru: 'Описание' }
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => I18nDto)
  description?: I18nDto;
}
