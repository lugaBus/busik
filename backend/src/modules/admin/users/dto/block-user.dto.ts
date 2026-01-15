import { IsString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class BlockUserDto {
  @ApiPropertyOptional({
    description: 'Reason for blocking/deactivating the user',
    example: 'Violation of terms of service',
  })
  @IsOptional()
  @IsString()
  blockReason?: string;
}
