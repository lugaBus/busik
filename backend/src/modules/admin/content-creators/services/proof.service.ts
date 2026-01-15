import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../../infrastructure/database/prisma.service';
import { Prisma } from '@prisma/client';
import { CreateProofDto } from '../dto/create-proof.dto';
import { UpdateProofDto } from '../dto/update-proof.dto';

@Injectable()
export class ProofService {
  constructor(private prisma: PrismaService) {}

  async create(contentCreatorId: string, createDto: CreateProofDto) {
    // Verify content creator exists
    const creator = await this.prisma.contentCreator.findUnique({
      where: { id: contentCreatorId },
    });
    if (!creator) {
      throw new NotFoundException(`Content creator with ID ${contentCreatorId} not found`);
    }

    const proof = await this.prisma.proof.create({
      data: {
        contentCreatorId,
        url: createDto.url || null,
        imageUrl: createDto.imageUrl || null,
        description: createDto.description ? (createDto.description as unknown as Prisma.InputJsonValue) : null,
      },
    });
    return {
      ...proof,
      imageUrl: this.getFullImageUrl(proof.imageUrl),
    };
  }

  private getFullImageUrl(imageUrl: string | null | undefined): string | null {
    if (!imageUrl) return null;
    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
      return imageUrl;
    }
    const baseUrl = process.env.BACKEND_URL || 'http://localhost:3001';
    return `${baseUrl}${imageUrl}`;
  }

  async findAllByCreator(contentCreatorId: string) {
    const proofs = await this.prisma.proof.findMany({
      where: { contentCreatorId },
      orderBy: { createdAt: 'desc' },
    });
    return proofs.map(proof => ({
      ...proof,
      imageUrl: this.getFullImageUrl(proof.imageUrl),
    }));
  }

  async findOne(id: string) {
    const proof = await this.prisma.proof.findUnique({
      where: { id },
    });
    if (!proof) {
      throw new NotFoundException(`Proof with ID ${id} not found`);
    }
    return {
      ...proof,
      imageUrl: this.getFullImageUrl(proof.imageUrl),
    };
  }

  async update(id: string, updateDto: UpdateProofDto) {
    await this.findOne(id); // Check if exists

    const updateData: Prisma.ProofUpdateInput = {
      updatedAt: new Date(),
    };

    if (updateDto.url !== undefined) updateData.url = updateDto.url;
    if (updateDto.imageUrl !== undefined) updateData.imageUrl = updateDto.imageUrl;
    if (updateDto.description !== undefined) {
      updateData.description = updateDto.description 
        ? (updateDto.description as unknown as Prisma.InputJsonValue) 
        : null;
    }

    const updated = await this.prisma.proof.update({
      where: { id },
      data: updateData,
    });
    return {
      ...updated,
      imageUrl: this.getFullImageUrl(updated.imageUrl),
    };
  }

  async remove(id: string) {
    await this.findOne(id); // Check if exists
    return this.prisma.proof.delete({
      where: { id },
    });
  }
}
