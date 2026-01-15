import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../infrastructure/database/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class ContentCreatorSubmissionRepository {
  constructor(private prisma: PrismaService) {}

  async create(data: Prisma.ContentCreatorSubmissionCreateInput) {
    return this.prisma.contentCreatorSubmission.create({
      data,
      include: {
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
    return this.prisma.contentCreatorSubmission.findUnique({
      where: { id },
      include: {
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
        proofSubmissions: {
          include: {
            statusHistory: {
              orderBy: {
                createdAt: 'desc',
              },
              take: 1,
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });
  }

  async findBySubmitter(submitterId?: string, userId?: string) {
    const where: Prisma.ContentCreatorSubmissionWhereInput = {};

    if (userId) {
      where.userId = userId;
    } else if (submitterId) {
      where.anonymousSession = {
        submitterId,
      };
    }

    return this.prisma.contentCreatorSubmission.findMany({
      where,
      include: {
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

  async findAllForAdmin() {
    return this.prisma.contentCreatorSubmission.findMany({
      select: {
        id: true,
        name: true,
        quote: true,
        description: true,
        locale: true,
        mainLink: true,
        photoUrls: true,
        rating: true,
        contentFormats: true,
        tone: true,
        audience: true,
        metrics: true,
        piterTest: true,
        categoryIds: true,
        tagIds: true,
        ratioIds: true,
        platforms: true,
        userId: true, // Explicitly include userId
        anonymousSessionId: true, // Explicitly include anonymousSessionId
        createdAt: true,
        updatedAt: true,
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
        proofSubmissions: {
          include: {
            statusHistory: {
              orderBy: {
                createdAt: 'desc',
              },
              take: 1,
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async update(id: string, data: Prisma.ContentCreatorSubmissionUpdateInput) {
    return this.prisma.contentCreatorSubmission.update({
      where: { id },
      data,
      include: {
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
        proofSubmissions: {
          include: {
            statusHistory: {
              orderBy: {
                createdAt: 'desc',
              },
              take: 1,
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });
  }

  async delete(id: string) {
    return this.prisma.contentCreatorSubmission.delete({
      where: { id },
    });
  }

  async checkOwnership(id: string, submitterId?: string, userId?: string): Promise<boolean> {
    const submission = await this.prisma.contentCreatorSubmission.findUnique({
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

    if (!submission) return false;

    // Check authenticated user ownership
    if (userId && submission.userId === userId) return true;
    
    // Check anonymous session ownership
    if (submitterId) {
      // If submission has anonymousSessionId, check via relation
      if (submission.anonymousSession?.submitterId === submitterId) return true;
      
      // Also check directly via anonymousSessionId if relation is not loaded
      // This handles cases where the relation might not be immediately available after creation
      if (submission.anonymousSessionId) {
        const session = await this.prisma.anonymousSession.findUnique({
          where: { id: submission.anonymousSessionId },
          select: { submitterId: true },
        });
        if (session?.submitterId === submitterId) return true;
      }
    }

    return false;
  }

  /**
   * Create a new status entry for content creator submission
   */
  async createStatus(data: {
    contentCreatorSubmissionId: string;
    status: string;
    reviewedById: string | null;
    comment?: string | null;
  }) {
    return this.prisma.contentCreatorSubmissionStatus.create({
      data: {
        contentCreatorSubmissionId: data.contentCreatorSubmissionId,
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
