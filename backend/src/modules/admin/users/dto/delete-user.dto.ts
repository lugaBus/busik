import { IsString, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class DeleteUserDto {
  @ApiPropertyOptional({
    description: 'Reason for deleting the user',
    example: 'User requested account deletion',
  })
  @IsOptional()
  @IsString()
  deleteReason?: string;
}
