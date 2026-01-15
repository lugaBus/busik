import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/roles.decorator';

@ApiTags('Admin')
@ApiBearerAuth()
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class AdminController {
  @Get()
  @ApiOperation({ summary: 'Get admin info' })
  getAdminInfo(@Request() req) {
    return {
      message: 'Admin API endpoint',
      version: '1.0.0',
      user: {
        id: req.user.userId,
        email: req.user.email,
        roles: req.user.roles || [],
        permissions: req.user.permissions || [],
      },
    };
  }
}
