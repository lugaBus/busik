import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { ContentCreatorSubmissionRepository } from '../repositories/content-creator-submission.repository';

@Injectable()
export class ContentCreatorSubmissionOwnershipGuard implements CanActivate {
  constructor(private repository: ContentCreatorSubmissionRepository) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const { id } = request.params;
    const userId = request.user?.userId;
    const submitterId = request.headers['x-submitter-id'] as string;

    if (!userId && !submitterId) {
      throw new ForbiddenException('Either authentication or submitter-id header is required');
    }

    const isOwner = await this.repository.checkOwnership(id, submitterId, userId);
    if (!isOwner) {
      throw new ForbiddenException('You do not have access to this content creator submission');
    }

    return true;
  }
}
