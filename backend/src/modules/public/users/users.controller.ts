import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('Public - Users')
@Controller('public/users')
export class PublicUsersController {
  // TODO: Implement public users endpoints
}
