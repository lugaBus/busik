import { Injectable, NotFoundException, ForbiddenException, Logger } from '@nestjs/common';
import { ContentCreatorSubmissionRepository } from '../repositories/content-creator-submission.repository';
import { AnonymousSessionService } from './anonymous-session.service';
import { CreateContentCreatorSubmissionDto } from '../dto/create-content-creator-submission.dto';
import { UpdateContentCreatorSubmissionDto } from '../dto/update-content-creator-submission.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class ContentCreatorSubmissionService {
  private readonly logger = new Logger(ContentCreatorSubmissionService.name);

  constructor(
    public repository: ContentCreatorSubmissionRepository,
    private anonymousSessionService: AnonymousSessionService,
  ) {}

  async create(
    dto: CreateContentCreatorSubmissionDto,
    submitterId?: string,
    userId?: string,
  ) {
    this.logger.log(`[CREATE] userId: ${userId}, submitterId: ${submitterId}, hasUserId: ${!!userId}, hasSubmitterId: ${!!submitterId}`);

    if (!userId && !submitterId) {
      throw new ForbiddenException('Either userId or submitterId is required');
    }

    const data: Prisma.ContentCreatorSubmissionCreateInput = {
      name: dto.name as unknown as Prisma.InputJsonValue,
      quote: dto.quote ? (dto.quote as unknown as Prisma.InputJsonValue) : null,
      description: dto.description ? (dto.description as unknown as Prisma.InputJsonValue) : null,
      locale: dto.locale || 'uk-UA',
      mainLink: dto.mainLink || null,
      photoUrls: dto.photoUrls ? (dto.photoUrls as unknown as Prisma.InputJsonValue) : null,
      rating: dto.rating || null,
      contentFormats: dto.contentFormats || [],
      tone: dto.tone || 0,
      audience: dto.audience ? (dto.audience as unknown as Prisma.InputJsonValue) : null,
      metrics: dto.metrics ? (dto.metrics as unknown as Prisma.InputJsonValue) : null,
      piterTest: dto.piterTest || null,
      categoryIds: dto.categoryIds || [],
      tagIds: dto.tagIds || [],
      ratioIds: dto.ratioIds || [],
      platforms: dto.platforms ? (dto.platforms as unknown as Prisma.InputJsonValue) : null,
      statusHistory: {
        create: {
          status: 'submitted',
          // reviewedById is null for initial status (system)
        },
      },
    };

    // Priority: userId takes precedence over submitterId
    // If user is authenticated, always use userId and ignore submitterId
    if (userId) {
      this.logger.log(`[CREATE] Using userId: ${userId}`);
      data.user = {
        connect: { id: userId },
      };
      // Explicitly set anonymousSessionId to null to avoid confusion
      data.anonymousSession = undefined;
    } else if (submitterId) {
      this.logger.log(`[CREATE] Using submitterId: ${submitterId}`);
      const session = await this.anonymousSessionService.getOrCreateSession(submitterId);
      this.logger.log(`[CREATE] Anonymous session created: ${session.id}`);
      data.anonymousSession = {
        connect: { id: session.id },
      };
      // Explicitly set userId to null
      data.user = undefined;
    }

    const created = await this.repository.create(data);
    this.logger.log(`[CREATE] Submission created - id: ${created.id}, userId: ${created.userId}, anonymousSessionId: ${created.anonymousSessionId}`);
    return created;
  }

  async findAll(submitterId?: string, userId?: string) {
    const submissions = await this.repository.findBySubmitter(submitterId, userId);
    // Add currentStatus to each submission for easier frontend consumption
    return submissions.map((submission: any) => ({
      ...submission,
      currentStatus: this.getCurrentStatus(submission),
    }));
  }

  async findOne(id: string, submitterId?: string, userId?: string) {
    const submission = await this.repository.findById(id);
    if (!submission) {
      throw new NotFoundException(`Content creator submission with ID ${id} not found`);
    }

    // Check ownership
    const isOwner = await this.repository.checkOwnership(id, submitterId, userId);
    if (!isOwner) {
      throw new ForbiddenException('You do not have access to this content creator submission');
    }

    // Add currentStatus for easier frontend consumption
    return {
      ...submission,
      currentStatus: this.getCurrentStatus(submission),
    };
  }

  async update(
    id: string,
    dto: UpdateContentCreatorSubmissionDto,
    submitterId?: string,
    userId?: string,
  ) {
    // Check ownership first
    const isOwner = await this.repository.checkOwnership(id, submitterId, userId);
    if (!isOwner) {
      throw new ForbiddenException('You do not have access to this content creator submission');
    }

    const data: Prisma.ContentCreatorSubmissionUpdateInput = {};
    if (dto.name !== undefined) data.name = dto.name as unknown as Prisma.InputJsonValue;
    if (dto.quote !== undefined) data.quote = dto.quote ? (dto.quote as unknown as Prisma.InputJsonValue) : null;
    if (dto.description !== undefined) data.description = dto.description ? (dto.description as unknown as Prisma.InputJsonValue) : null;
    if (dto.locale !== undefined) data.locale = dto.locale;
    if (dto.mainLink !== undefined) data.mainLink = dto.mainLink || null;
    if (dto.photoUrls !== undefined) data.photoUrls = dto.photoUrls ? (dto.photoUrls as unknown as Prisma.InputJsonValue) : null;
    if (dto.rating !== undefined) data.rating = dto.rating || null;
    if (dto.contentFormats !== undefined) data.contentFormats = dto.contentFormats || [];
    if (dto.tone !== undefined) data.tone = dto.tone;
    if (dto.audience !== undefined) data.audience = dto.audience ? (dto.audience as unknown as Prisma.InputJsonValue) : null;
    if (dto.metrics !== undefined) data.metrics = dto.metrics ? (dto.metrics as unknown as Prisma.InputJsonValue) : null;
    if (dto.piterTest !== undefined) data.piterTest = dto.piterTest || null;
    if (dto.categoryIds !== undefined) data.categoryIds = dto.categoryIds || [];
    if (dto.tagIds !== undefined) data.tagIds = dto.tagIds || [];
    if (dto.ratioIds !== undefined) data.ratioIds = dto.ratioIds || [];
    if (dto.platforms !== undefined) data.platforms = dto.platforms ? (dto.platforms as unknown as Prisma.InputJsonValue) : null;

    return this.repository.update(id, data);
  }

  async remove(id: string, submitterId?: string, userId?: string) {
    // Check ownership first
    const isOwner = await this.repository.checkOwnership(id, submitterId, userId);
    if (!isOwner) {
      throw new ForbiddenException('You do not have access to this content creator submission');
    }

    const submission = await this.repository.findById(id);
    if (!submission) {
      throw new NotFoundException(`Content creator submission with ID ${id} not found`);
    }

    const currentStatus = this.getCurrentStatus(submission);
    
    // User can delete if status is 'submitted' or 'in_review' or 'accepted' or 'declined'
    // But we mark as 'deleted_by_user' instead of physical deletion (only admin can physically delete)
    if (currentStatus === 'submitted' || currentStatus === 'in_review' || currentStatus === 'accepted' || currentStatus === 'declined') {
      // Mark as deleted_by_user instead of physical deletion
      await this.repository.createStatus({
        contentCreatorSubmissionId: id,
        status: 'deleted_by_user',
        reviewedById: userId || null, // null for anonymous users
        comment: null,
      });
      return { message: 'Content creator submission marked as deleted by user' };
    } else if (currentStatus === 'deleted_by_user') {
      // Already deleted by user
      throw new ForbiddenException('Content creator submission already deleted by user');
    } else {
      // Invalid state
      throw new ForbiddenException('Cannot delete content creator submission in current state');
    }
  }

  /**
   * Get current status from content creator submission
   * Returns the latest status from statusHistory, or null if no status exists
   */
  getCurrentStatus(submission: any): string | null {
    if (!submission.statusHistory || submission.statusHistory.length === 0) {
      return null;
    }
    // Status history is already ordered by createdAt desc, so first item is latest
    return submission.statusHistory[0]?.status || null;
  }

  /**
   * Admin: Get all content creator submissions (without ownership check)
   */
  async findAllForAdmin() {
    const submissions = await this.repository.findAllForAdmin();
    return submissions.map((submission: any) => ({
      ...submission,
      currentStatus: this.getCurrentStatus(submission),
    }));
  }

  /**
   * Admin: Get content creator submission by ID (without ownership check)
   */
  async findByIdForAdmin(id: string) {
    const submission = await this.repository.findById(id);
    if (!submission) {
      throw new NotFoundException(`Content creator submission with ID ${id} not found`);
    }
    return {
      ...submission,
      currentStatus: this.getCurrentStatus(submission),
    };
  }

  /**
   * Admin: Update status of a content creator submission
   */
  async updateStatus(id: string, status: 'submitted' | 'in_review' | 'accepted' | 'declined', reviewedById: string, comment?: string) {
    const submission = await this.repository.findById(id);
    if (!submission) {
      throw new NotFoundException(`Content creator submission with ID ${id} not found`);
    }

    // Create new status entry
    const statusEntry = await this.repository.createStatus({
      contentCreatorSubmissionId: id,
      status,
      reviewedById,
      comment: comment || null,
    });

    return {
      ...submission,
      currentStatus: status,
      statusHistory: [statusEntry, ...(submission.statusHistory || [])],
    };
  }

  /**
   * Admin: Update content creator submission (without ownership check)
   */
  async updateForAdmin(id: string, dto: UpdateContentCreatorSubmissionDto) {
    const submission = await this.repository.findById(id);
    if (!submission) {
      throw new NotFoundException(`Content creator submission with ID ${id} not found`);
    }

    const data: Prisma.ContentCreatorSubmissionUpdateInput = {};
    if (dto.name !== undefined) data.name = dto.name as unknown as Prisma.InputJsonValue;
    if (dto.quote !== undefined) data.quote = dto.quote ? (dto.quote as unknown as Prisma.InputJsonValue) : null;
    if (dto.description !== undefined) data.description = dto.description ? (dto.description as unknown as Prisma.InputJsonValue) : null;
    if (dto.locale !== undefined) data.locale = dto.locale;
    if (dto.mainLink !== undefined) data.mainLink = dto.mainLink || null;
    if (dto.photoUrls !== undefined) data.photoUrls = dto.photoUrls ? (dto.photoUrls as unknown as Prisma.InputJsonValue) : null;
    if (dto.rating !== undefined) data.rating = dto.rating || null;
    if (dto.contentFormats !== undefined) data.contentFormats = dto.contentFormats || [];
    if (dto.tone !== undefined) data.tone = dto.tone;
    if (dto.audience !== undefined) data.audience = dto.audience ? (dto.audience as unknown as Prisma.InputJsonValue) : null;
    if (dto.metrics !== undefined) data.metrics = dto.metrics ? (dto.metrics as unknown as Prisma.InputJsonValue) : null;
    if (dto.piterTest !== undefined) data.piterTest = dto.piterTest || null;
    if (dto.categoryIds !== undefined) data.categoryIds = dto.categoryIds || [];
    if (dto.tagIds !== undefined) data.tagIds = dto.tagIds || [];
    if (dto.ratioIds !== undefined) data.ratioIds = dto.ratioIds || [];
    if (dto.platforms !== undefined) data.platforms = dto.platforms ? (dto.platforms as unknown as Prisma.InputJsonValue) : null;

    const updated = await this.repository.update(id, data);
    return {
      ...updated,
      currentStatus: this.getCurrentStatus(updated),
    };
  }

  /**
   * Admin: Physically delete a content creator submission
   */
  async deleteForAdmin(id: string) {
    const submission = await this.repository.findById(id);
    if (!submission) {
      throw new NotFoundException(`Content creator submission with ID ${id} not found`);
    }

    await this.repository.delete(id);
    return { message: 'Content creator submission deleted successfully' };
  }
}
