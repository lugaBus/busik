import {
  IsString,
  IsOptional,
  IsArray,
  IsObject,
  IsNumber,
  ValidateNested,
  IsEnum,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { I18nDto } from './i18n.dto';


export class CreateContentCreatorDto {
  @ApiProperty({ 
    type: I18nDto,
    example: { en: 'Ivan Petrenko', ua: 'Іван Петренко', ru: 'Иван Петренко' }
  })
  @ValidateNested()
  @Type(() => I18nDto)
  name: I18nDto;

  @ApiPropertyOptional({ 
    type: I18nDto,
    example: { en: 'Quote text', ua: 'Текст цитати', ru: 'Текст цитаты' }
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => I18nDto)
  quote?: I18nDto;

  @ApiPropertyOptional({ 
    type: I18nDto,
    example: { en: 'Description text', ua: 'Текст опису', ru: 'Текст описания' }
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => I18nDto)
  description?: I18nDto;

  @ApiPropertyOptional({ example: 'uk-UA', default: 'uk-UA' })
  @IsOptional()
  @IsString()
  locale?: string;

  @ApiPropertyOptional({ example: 'https://youtube.com/@ivan-petrenko' })
  @IsOptional()
  @IsString()
  mainLink?: string;

  @ApiPropertyOptional({ 
    type: [String],
    example: ['/public/uploads/content-creators/photo1.jpg', '/public/uploads/content-creators/photo2.jpg'],
    description: 'Array of photo URLs (max 4 photos)'
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  photoUrls?: string[];

  @ApiPropertyOptional({ example: 0, default: 0 })
  @IsOptional()
  @IsNumber()
  position?: number;

  @ApiPropertyOptional({ example: 5, description: 'Rating from 1 to 10' })
  @IsOptional()
  @IsNumber()
  rating?: number;

  @ApiPropertyOptional({ enum: ['True', 'False', 'Unknown'], example: 'True' })
  @IsOptional()
  @IsString()
  piterTest?: string;

  @ApiPropertyOptional({ type: [String], example: ['category-id-1', 'category-id-2'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  categoryIds?: string[];

  @ApiPropertyOptional({
    type: [String],
    example: ['tag-id-1', 'tag-id-2'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tagIds?: string[];

  @ApiPropertyOptional({
    type: String,
    example: 'ratio-id-1',
  })
  @IsOptional()
  @IsString()
  ratioId?: string;

  @ApiPropertyOptional({
    type: [String],
    example: ['video', 'shorts', 'streams'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  contentFormats?: string[];

  @ApiPropertyOptional({
    type: Number,
    example: 0,
    description: 'Tone from -10 to +10, default 0',
    minimum: -10,
    maximum: 10,
  })
  @IsOptional()
  @IsNumber()
  @Min(-10, { message: 'Tone must be at least -10' })
  @Max(10, { message: 'Tone must be at most 10' })
  tone?: number;

  @ApiPropertyOptional({ 
    type: Object,
    description: 'Audience data as JSON object (any structure)',
    example: { age: [18, 35], geo: ["UA", "PL"], level: ["beginner"] }
  })
  @IsOptional()
  @IsObject()
  audience?: Record<string, any>;

  @ApiPropertyOptional({ 
    type: Object,
    description: 'Metrics data as JSON object (any structure)',
    example: { engagementRate: 4.2, postingFrequency: "daily" }
  })
  @IsOptional()
  @IsObject()
  metrics?: Record<string, any>;

  @ApiPropertyOptional({ enum: ['active', 'inactive', 'pending', 'user_added'], default: 'active' })
  @IsOptional()
  @IsEnum(['active', 'inactive', 'pending', 'user_added'])
  status?: string;
}
