import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../infrastructure/database/prisma.service';
import { randomUUID } from 'crypto';

@Injectable()
export class AnonymousSessionService {
  constructor(private prisma: PrismaService) {}

  /**
   * Get or create anonymous session by submitterId
   * submitterId is an opaque ID that client stores (cookie/localStorage)
   */
  async getOrCreateSession(submitterId: string) {
    let session = await this.prisma.anonymousSession.findUnique({
      where: { submitterId },
    });

    if (!session) {
      session = await this.prisma.anonymousSession.create({
        data: {
          submitterId,
        },
      });
    }

    return session;
  }

  /**
   * Generate a new submitterId (opaque ID for client)
   */
  generateSubmitterId(): string {
    return randomUUID();
  }

  /**
   * Validate submitterId format
   */
  isValidSubmitterId(submitterId: string): boolean {
    // UUID v4 format validation
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(submitterId);
  }
}
