import { IsString, IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { I18nDto } from '../../content-creators/dto/i18n.dto';

export class CreateRatioDto {
  @ApiProperty({ 
    type: I18nDto,
    example: { en: 'Ratio Name', ua: 'Назва рейтингу', ru: 'Название рейтинга' }
  })
  @ValidateNested()
  @Type(() => I18nDto)
  name: I18nDto;

  @ApiPropertyOptional({ example: 'ratio-slug' })
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
