import { Module } from '@nestjs/common';
import { RatiosController } from './ratios.controller';
import { RatiosService } from './ratios.service';
import { InfrastructureModule } from '../../../infrastructure/infrastructure.module';

@Module({
  imports: [InfrastructureModule],
  controllers: [RatiosController],
  providers: [RatiosService],
  exports: [RatiosService],
})
export class RatiosModule {}
