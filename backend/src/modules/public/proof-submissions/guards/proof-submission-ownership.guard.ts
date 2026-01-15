import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { ProofSubmissionRepository } from '../repositories/proof-submission.repository';

@Injectable()
export class ProofSubmissionOwnershipGuard implements CanActivate {
  constructor(private repository: ProofSubmissionRepository) {}

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
      throw new ForbiddenException('You do not have access to this proof submission');
    }

    return true;
  }
}
