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
import { RatiosService } from './ratios.service';
import { CreateRatioDto } from './dto/create-ratio.dto';
import { UpdateRatioDto } from './dto/update-ratio.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../auth/guards/roles.guard';
import { Roles } from '../../../auth/roles.decorator';

@ApiTags('Admin - Ratios')
@ApiBearerAuth()
@Controller('admin/ratios')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class RatiosController {
  constructor(private readonly ratiosService: RatiosService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new ratio' })
  @ApiResponse({ status: 201, description: 'Ratio created successfully' })
  create(@Body() createRatioDto: CreateRatioDto) {
    return this.ratiosService.create(createRatioDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all ratios' })
  @ApiResponse({ status: 200, description: 'List of ratios' })
  findAll() {
    return this.ratiosService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a ratio by ID' })
  @ApiResponse({ status: 200, description: 'Ratio found' })
  @ApiResponse({ status: 404, description: 'Ratio not found' })
  findOne(@Param('id') id: string) {
    return this.ratiosService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a ratio' })
  @ApiResponse({ status: 200, description: 'Ratio updated successfully' })
  update(@Param('id') id: string, @Body() updateRatioDto: UpdateRatioDto) {
    return this.ratiosService.update(id, updateRatioDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a ratio' })
  @ApiResponse({ status: 200, description: 'Ratio deleted successfully' })
  remove(@Param('id') id: string) {
    return this.ratiosService.remove(id);
  }
}
