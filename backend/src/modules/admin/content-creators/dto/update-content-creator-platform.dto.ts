import { PartialType } from '@nestjs/swagger';
import { CreateContentCreatorPlatformDto } from './create-content-creator-platform.dto';

export class UpdateContentCreatorPlatformDto extends PartialType(CreateContentCreatorPlatformDto) {}
