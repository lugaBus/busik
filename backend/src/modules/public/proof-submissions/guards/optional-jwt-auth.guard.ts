import { Injectable, ExecutionContext, Logger } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  private readonly logger = new Logger(OptionalJwtAuthGuard.name);

  // Override handleRequest to not throw error if no token
  handleRequest(err: any, user: any, info: any, context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    const hasAuthHeader = !!request.headers?.authorization;
    const url = request.url;
    
    // Logging for debugging - only log for content-creator-submissions endpoints
    if (url?.includes('content-creator-submissions') && hasAuthHeader) {
      this.logger.log(`[${url}] hasAuthHeader: true, hasUser: ${!!user}, userId: ${user?.userId}, error: ${err?.message || 'none'}, info: ${info?.message || 'none'}`);
    }
    
    // If there's an error or no user, just return null (don't throw)
    // The controller will handle the case when user is not authenticated
    return user || null;
  }
}
