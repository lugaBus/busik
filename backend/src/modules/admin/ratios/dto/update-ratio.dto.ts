import { PartialType } from '@nestjs/swagger';
import { CreateRatioDto } from './create-ratio.dto';

export class UpdateRatioDto extends PartialType(CreateRatioDto) {}
