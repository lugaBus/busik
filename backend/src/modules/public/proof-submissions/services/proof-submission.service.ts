import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { ProofSubmissionRepository } from '../repositories/proof-submission.repository';
import { AnonymousSessionService } from './anonymous-session.service';
import { CreateProofSubmissionDto } from '../dto/create-proof-submission.dto';
import { UpdateProofSubmissionDto } from '../dto/update-proof-submission.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class ProofSubmissionService {
  constructor(
    private repository: ProofSubmissionRepository,
    private anonymousSessionService: AnonymousSessionService,
  ) {}

  async create(
    dto: CreateProofSubmissionDto,
    submitterId?: string,
    userId?: string,
  ) {
    if (!userId && !submitterId) {
      throw new ForbiddenException('Either userId or submitterId is required');
    }

    if (!dto.contentCreatorId && !dto.contentCreatorSubmissionId) {
      throw new ForbiddenException('Either contentCreatorId or contentCreatorSubmissionId is required');
    }

    const data: Prisma.ProofSubmissionCreateInput = {
      url: dto.url || null,
      imageUrl: dto.imageUrl || null,
      description: dto.description ? (dto.description as Prisma.InputJsonValue) : null,
      statusHistory: {
        create: {
          status: 'submitted',
          // reviewedById is null for initial status (system)
        },
      },
    };

    // Connect to either content creator or submission
    if (dto.contentCreatorId) {
      data.contentCreator = {
        connect: { id: dto.contentCreatorId },
      };
    } else if (dto.contentCreatorSubmissionId) {
      data.contentCreatorSubmission = {
        connect: { id: dto.contentCreatorSubmissionId },
      };
    }

    if (userId) {
      data.user = {
        connect: { id: userId },
      };
    } else if (submitterId) {
      const session = await this.anonymousSessionService.getOrCreateSession(submitterId);
      data.anonymousSession = {
        connect: { id: session.id },
      };
    }

    return this.repository.create(data);
  }

  async findAll(contentCreatorId?: string, contentCreatorSubmissionId?: string, submitterId?: string, userId?: string) {
    let proofs: any[];
    if (contentCreatorSubmissionId) {
      proofs = await this.repository.findByContentCreatorSubmission(contentCreatorSubmissionId, submitterId, userId);
    } else if (contentCreatorId) {
      proofs = await this.repository.findByContentCreator(contentCreatorId, submitterId, userId);
    } else {
      throw new ForbiddenException('Either contentCreatorId or contentCreatorSubmissionId is required');
    }
    // Add currentStatus to each proof for easier frontend consumption
    return proofs.map((proof: any) => ({
      ...proof,
      currentStatus: this.getCurrentStatus(proof),
    }));
  }

  async findOne(id: string, submitterId?: string, userId?: string) {
    const proof = await this.repository.findById(id);
    if (!proof) {
      throw new NotFoundException(`Proof submission with ID ${id} not found`);
    }

    // Check ownership
    const isOwner = await this.repository.checkOwnership(id, submitterId, userId);
    if (!isOwner) {
      throw new ForbiddenException('You do not have access to this proof submission');
    }

    // Add currentStatus for easier frontend consumption
    return {
      ...proof,
      currentStatus: this.getCurrentStatus(proof),
    };
  }

  async update(
    id: string,
    dto: UpdateProofSubmissionDto,
    submitterId?: string,
    userId?: string,
  ) {
    // Check ownership first
    const isOwner = await this.repository.checkOwnership(id, submitterId, userId);
    if (!isOwner) {
      throw new ForbiddenException('You do not have access to this proof submission');
    }

    const data: Prisma.ProofSubmissionUpdateInput = {};
    if (dto.url !== undefined) data.url = dto.url || null;
    if (dto.imageUrl !== undefined) data.imageUrl = dto.imageUrl || null;
    if (dto.description !== undefined) {
      data.description = dto.description ? (dto.description as Prisma.InputJsonValue) : null;
    }

    return this.repository.update(id, data);
  }

  async remove(id: string, submitterId?: string, userId?: string) {
    // Check ownership first
    const isOwner = await this.repository.checkOwnership(id, submitterId, userId);
    if (!isOwner) {
      throw new ForbiddenException('You do not have access to this proof submission');
    }

    const proof = await this.repository.findById(id);
    if (!proof) {
      throw new NotFoundException(`Proof submission with ID ${id} not found`);
    }

    const currentStatus = this.getCurrentStatus(proof);
    
    // User can delete if status is 'submitted' or 'in_review' or 'accepted' or 'declined'
    // But we mark as 'deleted_by_user' instead of physical deletion (only admin can physically delete)
    if (currentStatus === 'submitted' || currentStatus === 'in_review' || currentStatus === 'accepted' || currentStatus === 'declined') {
      // Mark as deleted_by_user instead of physical deletion
      await this.repository.createStatus({
        proofSubmissionId: id,
        status: 'deleted_by_user',
        reviewedById: userId || null, // null for anonymous users
        comment: null,
      });
      return { message: 'Proof submission marked as deleted by user' };
    } else if (currentStatus === 'deleted_by_user') {
      // Already deleted by user
      throw new ForbiddenException('Proof submission already deleted by user');
    } else {
      // Invalid state
      throw new ForbiddenException('Cannot delete proof submission in current state');
    }
  }

  /**
   * Get current status from proof submission
   * Returns the latest status from statusHistory, or null if no status exists
   */
  getCurrentStatus(proof: any): string | null {
    if (!proof.statusHistory || proof.statusHistory.length === 0) {
      return null;
    }
    // Status history is already ordered by createdAt desc, so first item is latest
    return proof.statusHistory[0]?.status || null;
  }

  /**
   * Admin: Get all proof submissions for a content creator (without ownership check)
   */
  async findAllForAdmin(contentCreatorId: string) {
    const proofs = await this.repository.findByContentCreatorForAdmin(contentCreatorId);
    return proofs.map((proof: any) => ({
      ...proof,
      currentStatus: this.getCurrentStatus(proof),
    }));
  }

  /**
   * Admin: Get proof submission by ID (without ownership check)
   */
  async findByIdForAdmin(id: string) {
    const proof = await this.repository.findById(id);
    if (!proof) {
      throw new NotFoundException(`Proof submission with ID ${id} not found`);
    }
    return {
      ...proof,
      currentStatus: this.getCurrentStatus(proof),
    };
  }

  /**
   * Admin: Update status of a proof submission
   */
  async updateStatus(id: string, status: 'submitted' | 'in_review' | 'accepted' | 'declined', reviewedById: string, comment?: string) {
    const proof = await this.repository.findById(id);
    if (!proof) {
      throw new NotFoundException(`Proof submission with ID ${id} not found`);
    }

    // Create new status entry
    const statusEntry = await this.repository.createStatus({
      proofSubmissionId: id,
      status,
      reviewedById,
      comment: comment || null,
    });

    return {
      ...proof,
      currentStatus: status,
      statusHistory: [statusEntry, ...(proof.statusHistory || [])],
    };
  }

  /**
   * Admin: Update proof submission (without ownership check)
   */
  async updateForAdmin(id: string, dto: UpdateProofSubmissionDto) {
    const proof = await this.repository.findById(id);
    if (!proof) {
      throw new NotFoundException(`Proof submission with ID ${id} not found`);
    }

    const data: Prisma.ProofSubmissionUpdateInput = {};
    if (dto.url !== undefined) data.url = dto.url || null;
    if (dto.imageUrl !== undefined) data.imageUrl = dto.imageUrl || null;
    if (dto.description !== undefined) {
      data.description = dto.description ? (dto.description as Prisma.InputJsonValue) : null;
    }

    const updated = await this.repository.update(id, data);
    return {
      ...updated,
      currentStatus: this.getCurrentStatus(updated),
    };
  }

  /**
   * Admin: Physically delete a proof submission
   */
  async deleteForAdmin(id: string) {
    const proof = await this.repository.findById(id);
    if (!proof) {
      throw new NotFoundException(`Proof submission with ID ${id} not found`);
    }

    await this.repository.delete(id);
    return { message: 'Proof submission deleted successfully' };
  }
}
