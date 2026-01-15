import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('Public')
@Controller('public')
export class PublicController {
  @Get()
  getPublicInfo() {
    return {
      message: 'Public API endpoint',
      version: '1.0.0',
    };
  }
}
