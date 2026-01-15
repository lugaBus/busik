import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PlatformsService } from './platforms.service';
import { CreatePlatformDto } from './dto/create-platform.dto';
import { UpdatePlatformDto } from './dto/update-platform.dto';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../auth/guards/roles.guard';
import { Roles } from '../../../auth/roles.decorator';

@ApiTags('Admin - Platforms')
@ApiBearerAuth()
@Controller('admin/platforms')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class PlatformsController {
  constructor(private readonly platformsService: PlatformsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new platform' })
  create(@Body() createDto: CreatePlatformDto) {
    return this.platformsService.create(createDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all platforms' })
  findAll() {
    return this.platformsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a platform by ID' })
  findOne(@Param('id') id: string) {
    return this.platformsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a platform' })
  update(@Param('id') id: string, @Body() updateDto: UpdatePlatformDto) {
    return this.platformsService.update(id, updateDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a platform' })
  remove(@Param('id') id: string) {
    return this.platformsService.remove(id);
  }
}
