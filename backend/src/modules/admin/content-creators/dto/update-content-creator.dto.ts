import { PartialType } from '@nestjs/swagger';
import { CreateContentCreatorDto } from './create-content-creator.dto';

export class UpdateContentCreatorDto extends PartialType(CreateContentCreatorDto) {}
