import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../infrastructure/database/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class ProofSubmissionRepository {
  constructor(private prisma: PrismaService) {}

  async create(data: Prisma.ProofSubmissionCreateInput) {
    return this.prisma.proofSubmission.create({
      data,
      include: {
        contentCreator: {
          select: {
            id: true,
            name: true,
          },
        },
        contentCreatorSubmission: {
          select: {
            id: true,
            name: true,
          },
        },
        statusHistory: {
          orderBy: {
            createdAt: 'desc',
          },
          take: 1,
          include: {
            reviewedBy: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    });
  }

  async findById(id: string) {
    return this.prisma.proofSubmission.findUnique({
      where: { id },
      include: {
        contentCreator: {
          select: {
            id: true,
            name: true,
          },
        },
        contentCreatorSubmission: {
          select: {
            id: true,
            name: true,
          },
        },
        statusHistory: {
          orderBy: {
            createdAt: 'desc',
          },
          take: 1,
          include: {
            reviewedBy: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    });
  }
  
  async findByContentCreatorSubmission(contentCreatorSubmissionId: string, submitterId?: string, userId?: string) {
    // Filter ONLY by submission ID - all proofs for this submission should be visible
    // This ensures that proofs are tied to the submission, not to the user
    const where: Prisma.ProofSubmissionWhereInput = {
      contentCreatorSubmissionId,
      // Don't filter by userId/submitterId - we want all proofs for this submission
    };

    return this.prisma.proofSubmission.findMany({
      where,
      include: {
        contentCreatorSubmission: {
          select: {
            id: true,
            name: true,
          },
        },
        statusHistory: {
          orderBy: {
            createdAt: 'desc',
          },
          take: 1,
          include: {
            reviewedBy: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findByContentCreator(contentCreatorId: string, submitterId?: string, userId?: string) {
    const where: Prisma.ProofSubmissionWhereInput = {
      contentCreatorId,
    };

    if (userId) {
      where.userId = userId;
    } else if (submitterId) {
      where.anonymousSession = {
        submitterId,
      };
    }

    return this.prisma.proofSubmission.findMany({
      where,
      include: {
        contentCreator: {
          select: {
            id: true,
            name: true,
          },
        },
        statusHistory: {
          orderBy: {
            createdAt: 'desc',
          },
          take: 1,
          include: {
            reviewedBy: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async update(id: string, data: Prisma.ProofSubmissionUpdateInput) {
    return this.prisma.proofSubmission.update({
      where: { id },
      data,
      include: {
        contentCreator: {
          select: {
            id: true,
            name: true,
          },
        },
        contentCreatorSubmission: {
          select: {
            id: true,
            name: true,
          },
        },
        statusHistory: {
          orderBy: {
            createdAt: 'desc',
          },
          take: 1,
          include: {
            reviewedBy: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    });
  }

  async delete(id: string) {
    return this.prisma.proofSubmission.delete({
      where: { id },
    });
  }

  async checkOwnership(id: string, submitterId?: string, userId?: string): Promise<boolean> {
    const proof = await this.prisma.proofSubmission.findUnique({
      where: { id },
      select: {
        userId: true,
        anonymousSessionId: true,
        anonymousSession: {
          select: {
            submitterId: true,
          },
        },
      },
    });

    if (!proof) return false;

    if (userId && proof.userId === userId) return true;
    if (submitterId && proof.anonymousSession?.submitterId === submitterId) return true;

    return false;
  }

  /**
   * Admin: Get all proof submissions for a content creator (without ownership check)
   */
  async findByContentCreatorForAdmin(contentCreatorId: string) {
    return this.prisma.proofSubmission.findMany({
      where: {
        contentCreatorId,
      },
      include: {
        contentCreator: {
          select: {
            id: true,
            name: true,
          },
        },
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        anonymousSession: {
          select: {
            id: true,
            submitterId: true,
          },
        },
        statusHistory: {
          orderBy: {
            createdAt: 'desc',
          },
          take: 1,
          include: {
            reviewedBy: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  /**
   * Create a new status entry for proof submission
   */
  async createStatus(data: {
    proofSubmissionId: string;
    status: string;
    reviewedById: string | null;
    comment?: string | null;
  }) {
    return this.prisma.proofSubmissionStatus.create({
      data: {
        proofSubmissionId: data.proofSubmissionId,
        status: data.status,
        reviewedById: data.reviewedById,
        comment: data.comment || null,
      },
      include: {
        reviewedBy: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });
  }
}
