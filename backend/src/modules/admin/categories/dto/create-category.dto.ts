import { IsString, IsOptional, MinLength, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { I18nDto } from '../../content-creators/dto/i18n.dto';

export class CreateCategoryDto {
  @ApiProperty({ 
    type: I18nDto,
    example: { en: 'Technology', ua: 'Технології', ru: 'Технологии' }
  })
  @ValidateNested()
  @Type(() => I18nDto)
  name: I18nDto;

  @ApiPropertyOptional({ example: 'technology' })
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
