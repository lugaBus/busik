import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  NotFoundException,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { unlinkSync } from 'fs';
import { validateImageFile } from '../../../utils/file-validator';
import { ContentCreatorService } from './services/content-creator.service';
import { ProofService } from './services/proof.service';
import { CreateContentCreatorDto } from './dto/create-content-creator.dto';
import { UpdateContentCreatorDto } from './dto/update-content-creator.dto';
import { CreateProofDto } from './dto/create-proof.dto';
import { UpdateProofDto } from './dto/update-proof.dto';
import { CreateContentCreatorPlatformDto } from './dto/create-content-creator-platform.dto';
import { UpdateContentCreatorPlatformDto } from './dto/update-content-creator-platform.dto';
import { CreatePiterTestProofDto } from './dto/create-piter-test-proof.dto';
import { UpdatePiterTestProofDto } from './dto/update-piter-test-proof.dto';
import { UpdateProofSubmissionStatusDto } from './dto/update-proof-submission-status.dto';
import { UpdateContentCreatorSubmissionStatusDto } from './dto/update-content-creator-submission-status.dto';
import { UpdateContentCreatorSubmissionDto } from '../../public/content-creator-submissions/dto/update-content-creator-submission.dto';
import { UpdateProofSubmissionDto } from '../../public/proof-submissions/dto/update-proof-submission.dto';
import { ProofSubmissionService } from '../../public/proof-submissions/services/proof-submission.service';
import { ContentCreatorSubmissionService } from '../../public/content-creator-submissions/services/content-creator-submission.service';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../auth/guards/roles.guard';
import { Roles } from '../../../auth/roles.decorator';

@ApiTags('Admin - Content Creators')
@ApiBearerAuth()
@Controller('admin/content-creators')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class ContentCreatorsController {
  constructor(
    private readonly contentCreatorService: ContentCreatorService,
    private readonly proofService: ProofService,
    private readonly proofSubmissionService: ProofSubmissionService,
    private readonly contentCreatorSubmissionService: ContentCreatorSubmissionService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a new content creator' })
  @ApiResponse({ status: 201, description: 'Content creator created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  create(@Body() createDto: CreateContentCreatorDto, @Request() req) {
    return this.contentCreatorService.create(createDto, req.user?.userId);
  }

  @Get()
  @ApiOperation({ summary: 'Get all content creators with pagination' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'status', required: false, enum: ['active', 'inactive', 'pending', 'user_added'] })
  @ApiQuery({ name: 'category', required: false, type: String })
  @ApiQuery({ name: 'ratio', required: false, type: String })
  @ApiQuery({ name: 'sortBy', required: false, enum: ['name', 'rating', 'status', 'position', 'createdAt', 'categories', 'ratios'] })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['asc', 'desc'] })
  @ApiResponse({ status: 200, description: 'List of content creators' })
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('category') category?: string,
    @Query('ratio') ratio?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: 'asc' | 'desc',
  ) {
    return this.contentCreatorService.findAll({
      page: page ? parseInt(page) : undefined,
      limit: limit ? parseInt(limit) : undefined,
      search,
      status,
      category,
      ratio,
      sortBy: sortBy as any,
      sortOrder: sortOrder || 'asc',
    });
  }

  @Patch('positions')
  @ApiOperation({ summary: 'Update positions of content creators' })
  @ApiResponse({ status: 200, description: 'Positions updated successfully' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        positions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              position: { type: 'number' },
            },
          },
        },
      },
    },
  })
  async updatePositions(@Body() body: { positions: Array<{ id: string; position: number }> }) {
    return this.contentCreatorService.updatePositions(body.positions);
  }

  // Content Creator Submissions endpoints - MUST be before @Post(':id/photo') to avoid route conflicts
  @Get('submissions')
  @ApiOperation({ summary: 'Get all content creator submissions (admin)' })
  @ApiResponse({ status: 200, description: 'List of content creator submissions' })
  async getContentCreatorSubmissions() {
    return this.contentCreatorSubmissionService.findAllForAdmin();
  }

  @Get('submissions/:submissionId')
  @ApiOperation({ summary: 'Get a content creator submission by ID (admin)' })
  @ApiResponse({ status: 200, description: 'Content creator submission found' })
  @ApiResponse({ status: 404, description: 'Content creator submission not found' })
  async getContentCreatorSubmission(@Param('submissionId') submissionId: string) {
    return this.contentCreatorSubmissionService.findByIdForAdmin(submissionId);
  }

  @Patch('submissions/:submissionId/status')
  @ApiOperation({ summary: 'Update status of a content creator submission (admin)' })
  @ApiResponse({ status: 200, description: 'Content creator submission status updated' })
  async updateContentCreatorSubmissionStatus(
    @Param('submissionId') submissionId: string,
    @Body() updateDto: UpdateContentCreatorSubmissionStatusDto,
    @Request() req: any,
  ) {
    const userId = req.user.userId;
    
    // Get submission before updating status
    const submission = await this.contentCreatorSubmissionService.findByIdForAdmin(submissionId);

    // Update status
    const updated = await this.contentCreatorSubmissionService.updateStatus(
      submissionId,
      updateDto.status,
      userId,
      updateDto.comment,
    );

    // If status is accepted, copy to content creators table
    if (updateDto.status === 'accepted') {
      const createdCreator = await this.contentCreatorService.create({
        name: submission.name as any,
        quote: submission.quote as any,
        description: submission.description as any,
        locale: submission.locale,
        mainLink: submission.mainLink || undefined,
        photoUrls: submission.photoUrls as string[] | undefined,
        rating: submission.rating || undefined,
        contentFormats: submission.contentFormats || [],
        tone: submission.tone,
        audience: submission.audience as any,
        metrics: submission.metrics as any,
        piterTest: submission.piterTest || undefined,
        categoryIds: submission.categoryIds || [],
        tagIds: submission.tagIds || [],
        ratioId: submission.ratioIds && submission.ratioIds.length > 0 ? submission.ratioIds[0] : undefined,
        status: 'active',
      }, userId);

      // Copy proofs from submission to content creator
      if (submission.proofSubmissions && submission.proofSubmissions.length > 0) {
        for (const proofSubmission of submission.proofSubmissions) {
          // Only copy proofs with 'submitted' status (not declined or deleted)
          const currentStatus = proofSubmission.statusHistory?.[0]?.status || 'submitted';
          if (currentStatus === 'submitted' || currentStatus === 'in_review') {
            // Check if proof already exists (avoid duplicates)
            const existingProofs = await this.proofService.findAllByCreator(createdCreator.id);
            const alreadyExists = existingProofs.some(
              (p) => p.url === proofSubmission.url && p.imageUrl === proofSubmission.imageUrl,
            );

            if (!alreadyExists) {
              await this.proofService.create(createdCreator.id, {
                url: proofSubmission.url || undefined,
                imageUrl: proofSubmission.imageUrl || undefined,
                description: proofSubmission.description as any,
              });
            }
          }
        }
      }

      // TODO: Copy platforms if needed
    }

    return updated;
  }

  @Patch('submissions/:submissionId')
  @ApiOperation({ summary: 'Update a content creator submission (admin)' })
  @ApiResponse({ status: 200, description: 'Content creator submission updated' })
  async updateContentCreatorSubmission(
    @Param('submissionId') submissionId: string,
    @Body() updateDto: UpdateContentCreatorSubmissionDto,
  ) {
    return this.contentCreatorSubmissionService.updateForAdmin(submissionId, updateDto);
  }

  @Post('submissions/:submissionId/photo')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './public/uploads/content-creator-submissions',
        filename: (req, file, cb) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname);
          cb(null, `submission-${uniqueSuffix}${ext}`);
        },
      }),
      fileFilter: (req, file, cb) => {
        if (!file.mimetype.match(/\/(jpg|jpeg|png|gif|webp)$/)) {
          return cb(new BadRequestException('Only image files are allowed!'), false);
        }
        cb(null, true);
      },
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB
      },
    }),
  )
  @ApiOperation({ summary: 'Add photo to content creator submission (max 4 photos)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Photo added successfully' })
  @ApiResponse({ status: 400, description: 'Invalid file or maximum photos limit reached' })
  @ApiResponse({ status: 404, description: 'Content creator submission not found' })
  async addSubmissionPhoto(
    @Param('submissionId') submissionId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    console.log('addSubmissionPhoto called with submissionId:', submissionId);
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }
    
    // Validate file by checking magic bytes (real file content)
    const filePath = join(process.cwd(), 'public', 'uploads', 'content-creator-submissions', file.filename);
    try {
      validateImageFile(filePath, file.mimetype);
    } catch (error) {
      // Delete invalid file
      try {
        unlinkSync(filePath);
      } catch (unlinkError) {
        // Ignore unlink errors
      }
      throw error;
    }
    
    const submission = await this.contentCreatorSubmissionService.findByIdForAdmin(submissionId);
    if (!submission) {
      // Delete uploaded file if submission not found
      try {
        unlinkSync(filePath);
      } catch (unlinkError) {
        // Ignore unlink errors
      }
      throw new NotFoundException(`Content creator submission with ID ${submissionId} not found`);
    }
    const currentPhotos = (submission.photoUrls as any) || [];
    if (currentPhotos.length >= 4) {
      // Delete uploaded file if limit exceeded
      try {
        unlinkSync(filePath);
      } catch (unlinkError) {
        // Ignore unlink errors
      }
      throw new BadRequestException('Maximum 4 photos allowed');
    }
    const photoUrl = `/public/uploads/content-creator-submissions/${file.filename}`;
    const newPhotos = [...currentPhotos, photoUrl];
    const updated = await this.contentCreatorSubmissionService.updateForAdmin(submissionId, { photoUrls: newPhotos });
    console.log('Photo added successfully, updated submission:', updated.id);
    return updated;
  }

  @Delete('submissions/:submissionId/photo/:photoIndex')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove photo from content creator submission' })
  @ApiResponse({ status: 204, description: 'Photo removed successfully' })
  @ApiResponse({ status: 404, description: 'Content creator submission not found' })
  async removeSubmissionPhoto(
    @Param('submissionId') submissionId: string,
    @Param('photoIndex') photoIndex: string,
  ) {
    const submission = await this.contentCreatorSubmissionService.findByIdForAdmin(submissionId);
    const currentPhotos = (submission.photoUrls as any) || [];
    const index = parseInt(photoIndex, 10);
    if (index < 0 || index >= currentPhotos.length) {
      throw new BadRequestException('Invalid photo index');
    }
    const newPhotos = currentPhotos.filter((_: any, i: number) => i !== index);
    await this.contentCreatorSubmissionService.updateForAdmin(submissionId, { photoUrls: newPhotos });
  }

  @Delete('submissions/:submissionId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a content creator submission (admin - physical deletion)' })
  @ApiResponse({ status: 204, description: 'Content creator submission deleted successfully' })
  async deleteContentCreatorSubmission(
    @Param('submissionId') submissionId: string,
  ) {
    await this.contentCreatorSubmissionService.deleteForAdmin(submissionId);
  }

  @Get(':id/status-history')
  @ApiOperation({ summary: 'Get status change history for a content creator' })
  @ApiResponse({ status: 200, description: 'Status history retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Content creator not found' })
  getStatusHistory(@Param('id') id: string) {
    return this.contentCreatorService.getStatusHistory(id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a content creator by ID' })
  @ApiResponse({ status: 200, description: 'Content creator found' })
  @ApiResponse({ status: 404, description: 'Content creator not found' })
  findOne(@Param('id') id: string) {
    return this.contentCreatorService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a content creator' })
  @ApiResponse({ status: 200, description: 'Content creator updated successfully' })
  @ApiResponse({ status: 404, description: 'Content creator not found' })
  update(
    @Param('id') id: string,
    @Body() updateDto: UpdateContentCreatorDto,
    @Request() req,
  ) {
    return this.contentCreatorService.update(id, updateDto, req.user?.userId);
  }

  // Proof endpoints
  @Post(':id/proofs')
  @ApiOperation({ summary: 'Add a proof to a content creator' })
  @ApiResponse({ status: 201, description: 'Proof created successfully' })
  @ApiResponse({ status: 404, description: 'Content creator not found' })
  createProof(
    @Param('id') contentCreatorId: string,
    @Body() createProofDto: CreateProofDto,
  ) {
    return this.proofService.create(contentCreatorId, createProofDto);
  }

  @Get(':id/proofs')
  @ApiOperation({ summary: 'Get all proofs for a content creator' })
  @ApiResponse({ status: 200, description: 'List of proofs' })
  getProofs(@Param('id') contentCreatorId: string) {
    return this.proofService.findAllByCreator(contentCreatorId);
  }

  @Get('proofs/:proofId')
  @ApiOperation({ summary: 'Get a proof by ID' })
  @ApiResponse({ status: 200, description: 'Proof found' })
  @ApiResponse({ status: 404, description: 'Proof not found' })
  getProof(@Param('proofId') proofId: string) {
    return this.proofService.findOne(proofId);
  }

  @Patch('proofs/:proofId')
  @ApiOperation({ summary: 'Update a proof' })
  @ApiResponse({ status: 200, description: 'Proof updated successfully' })
  updateProof(
    @Param('proofId') proofId: string,
    @Body() updateProofDto: UpdateProofDto,
  ) {
    return this.proofService.update(proofId, updateProofDto);
  }

  @Post('proofs/:proofId/image')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './public/uploads/proofs',
        filename: (req, file, cb) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname);
          cb(null, `proof-${uniqueSuffix}${ext}`);
        },
      }),
      fileFilter: (req, file, cb) => {
        if (!file.mimetype.match(/\/(jpg|jpeg|png|gif|webp)$/)) {
          return cb(new BadRequestException('Only image files are allowed!'), false);
        }
        cb(null, true);
      },
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB
      },
    }),
  )
  @ApiOperation({ summary: 'Upload image for proof' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Image uploaded successfully' })
  @ApiResponse({ status: 400, description: 'Invalid file' })
  @ApiResponse({ status: 404, description: 'Proof not found' })
  async uploadProofImage(
    @Param('proofId') proofId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }
    
    // Validate file by checking magic bytes (real file content)
    const filePath = join(process.cwd(), 'public', 'uploads', 'proofs', file.filename);
    try {
      validateImageFile(filePath, file.mimetype);
    } catch (error) {
      // Delete invalid file
      try {
        unlinkSync(filePath);
      } catch (unlinkError) {
        // Ignore unlink errors
      }
      throw error;
    }
    
    const imageUrl = `/public/uploads/proofs/${file.filename}`;
    return this.proofService.update(proofId, { imageUrl });
  }

  @Delete('proofs/:proofId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a proof' })
  @ApiResponse({ status: 204, description: 'Proof deleted successfully' })
  @ApiResponse({ status: 404, description: 'Proof not found' })
  removeProof(@Param('proofId') proofId: string) {
    return this.proofService.remove(proofId);
  }

  @Post(':id/platforms')
  @ApiOperation({ summary: 'Add platform to content creator' })
  @ApiResponse({ status: 201, description: 'Platform added successfully' })
  @ApiResponse({ status: 400, description: 'Invalid data or duplicate platform URL' })
  @ApiResponse({ status: 404, description: 'Content creator or platform not found' })
  addPlatform(
    @Param('id') id: string,
    @Body() createDto: CreateContentCreatorPlatformDto,
  ) {
    return this.contentCreatorService.addPlatform(
      id,
      createDto.platformId,
      createDto.url,
      createDto.description,
    );
  }

  @Get(':id/platforms')
  @ApiOperation({ summary: 'Get all platforms for content creator' })
  @ApiResponse({ status: 200, description: 'Platforms retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Content creator not found' })
  async getPlatforms(@Param('id') id: string) {
    const creator = await this.contentCreatorService.findOne(id);
    return (creator as any).platforms || [];
  }

  @Patch('platforms/:platformId')
  @ApiOperation({ summary: 'Update content creator platform' })
  @ApiResponse({ status: 200, description: 'Platform updated successfully' })
  @ApiResponse({ status: 404, description: 'Platform not found' })
  updatePlatform(
    @Param('platformId') platformId: string,
    @Body() updateDto: UpdateContentCreatorPlatformDto,
  ) {
    return this.contentCreatorService.updatePlatform(platformId, updateDto);
  }

  @Delete('platforms/:platformId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove platform from content creator' })
  @ApiResponse({ status: 204, description: 'Platform removed successfully' })
  @ApiResponse({ status: 404, description: 'Platform not found' })
  removePlatform(@Param('platformId') platformId: string) {
    return this.contentCreatorService.removePlatform(platformId);
  }

  @Post(':id/piter-test-proofs')
  @ApiOperation({ summary: 'Add Piter Test Proof to content creator' })
  @ApiResponse({ status: 201, description: 'Piter Test Proof added successfully' })
  @ApiResponse({ status: 400, description: 'Invalid data' })
  @ApiResponse({ status: 404, description: 'Content creator not found' })
  addPiterTestProof(
    @Param('id') id: string,
    @Body() createDto: CreatePiterTestProofDto,
  ) {
    return this.contentCreatorService.addPiterTestProof(
      id,
      createDto.url,
      createDto.imageUrl,
      createDto.description,
    );
  }

  @Get(':id/piter-test-proofs')
  @ApiOperation({ summary: 'Get all Piter Test Proofs for content creator' })
  @ApiResponse({ status: 200, description: 'Piter Test Proofs retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Content creator not found' })
  async getPiterTestProofs(@Param('id') id: string) {
    const creator = await this.contentCreatorService.findOne(id);
    return (creator as any).piterTestProofs?.map((proof: any) => ({
      ...proof,
      imageUrl: proof.imageUrl,
      description: proof.description,
    })) || [];
  }

  @Patch('piter-test-proofs/:proofId')
  @ApiOperation({ summary: 'Update content creator Piter Test Proof' })
  @ApiResponse({ status: 200, description: 'Piter Test Proof updated successfully' })
  @ApiResponse({ status: 404, description: 'Piter Test Proof not found' })
  updatePiterTestProof(
    @Param('proofId') proofId: string,
    @Body() updateDto: UpdatePiterTestProofDto,
  ) {
    return this.contentCreatorService.updatePiterTestProof(proofId, updateDto);
  }

  @Delete('piter-test-proofs/:proofId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove Piter Test Proof from content creator' })
  @ApiResponse({ status: 204, description: 'Piter Test Proof removed successfully' })
  @ApiResponse({ status: 404, description: 'Piter Test Proof not found' })
  removePiterTestProof(@Param('proofId') proofId: string) {
    return this.contentCreatorService.removePiterTestProof(proofId);
  }

  @Post('piter-test-proofs/:proofId/image')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './public/uploads/piter-test-proofs',
        filename: (req, file, cb) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname);
          cb(null, `piter-test-proof-${uniqueSuffix}${ext}`);
        },
      }),
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB
      },
    }),
  )
  @ApiOperation({ summary: 'Upload image for Piter Test Proof' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Image uploaded successfully' })
  @ApiResponse({ status: 400, description: 'Invalid file' })
  @ApiResponse({ status: 404, description: 'Piter Test Proof not found' })
  async uploadPiterTestProofImage(
    @Param('proofId') proofId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }
    
    // Validate file by checking magic bytes (real file content)
    const filePath = join(process.cwd(), 'public', 'uploads', 'piter-test-proofs', file.filename);
    try {
      validateImageFile(filePath, file.mimetype);
    } catch (error) {
      // Delete invalid file
      try {
        unlinkSync(filePath);
      } catch (unlinkError) {
        // Ignore unlink errors
      }
      throw error;
    }
    
    const imageUrl = `/public/uploads/piter-test-proofs/${file.filename}`;
    return this.contentCreatorService.updatePiterTestProof(proofId, { imageUrl });
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a content creator' })
  @ApiResponse({ status: 204, description: 'Content creator deleted successfully' })
  @ApiResponse({ status: 404, description: 'Content creator not found' })
  remove(@Param('id') id: string) {
    return this.contentCreatorService.remove(id);
  }

  @Get(':id/proof-submissions')
  @ApiOperation({ summary: 'Get all proof submissions for a content creator (admin)' })
  @ApiResponse({ status: 200, description: 'List of proof submissions' })
  async getProofSubmissions(@Param('id') id: string) {
    return this.proofSubmissionService.findAllForAdmin(id);
  }

  @Patch(':id/proof-submissions/:proofSubmissionId/status')
  @ApiOperation({ summary: 'Update status of a proof submission (admin)' })
  @ApiResponse({ status: 200, description: 'Proof submission status updated' })
  async updateProofSubmissionStatus(
    @Param('id') contentCreatorId: string,
    @Param('proofSubmissionId') proofSubmissionId: string,
    @Body() updateDto: UpdateProofSubmissionStatusDto,
    @Request() req: any,
  ) {
    const userId = req.user.userId;
    
    // Get proof submission before updating status
    const proofSubmission = await this.proofSubmissionService.findByIdForAdmin(proofSubmissionId);

    // Update status
    const updated = await this.proofSubmissionService.updateStatus(
      proofSubmissionId,
      updateDto.status,
      userId,
      updateDto.comment,
    );

    // If status is accepted, copy to proofs table
    if (updateDto.status === 'accepted') {
      // Check if proof already exists (avoid duplicates)
      const existingProofs = await this.proofService.findAllByCreator(contentCreatorId);
      const alreadyExists = existingProofs.some(
        (p) => p.url === proofSubmission.url && p.imageUrl === proofSubmission.imageUrl,
      );

      if (!alreadyExists) {
        await this.proofService.create(contentCreatorId, {
          url: proofSubmission.url || undefined,
          imageUrl: proofSubmission.imageUrl || undefined,
          description: proofSubmission.description as any,
        });
      }
    }

    return updated;
  }

  @Delete(':id/proof-submissions/:proofSubmissionId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a proof submission (admin - physical deletion)' })
  @ApiResponse({ status: 204, description: 'Proof submission deleted successfully' })
  async deleteProofSubmission(
    @Param('proofSubmissionId') proofSubmissionId: string,
  ) {
    await this.proofSubmissionService.deleteForAdmin(proofSubmissionId);
  }

  // Proof submissions endpoints for content creator submissions
  @Get('submissions/:submissionId/proof-submissions')
  @ApiOperation({ summary: 'Get all proof submissions for a content creator submission (admin)' })
  @ApiResponse({ status: 200, description: 'List of proof submissions' })
  async getProofSubmissionsForSubmission(@Param('submissionId') submissionId: string) {
    return this.proofSubmissionService.findAll(undefined, submissionId);
  }

  @Patch('submissions/:submissionId/proof-submissions/:proofSubmissionId')
  @ApiOperation({ summary: 'Update a proof submission for a content creator submission (admin)' })
  @ApiResponse({ status: 200, description: 'Proof submission updated' })
  async updateProofSubmissionForSubmission(
    @Param('submissionId') submissionId: string,
    @Param('proofSubmissionId') proofSubmissionId: string,
    @Body() updateDto: UpdateProofSubmissionDto,
  ) {
    return this.proofSubmissionService.updateForAdmin(proofSubmissionId, updateDto);
  }

  @Patch('submissions/:submissionId/proof-submissions/:proofSubmissionId/status')
  @ApiOperation({ summary: 'Update status of a proof submission for a content creator submission (admin)' })
  @ApiResponse({ status: 200, description: 'Proof submission status updated' })
  async updateProofSubmissionStatusForSubmission(
    @Param('submissionId') submissionId: string,
    @Param('proofSubmissionId') proofSubmissionId: string,
    @Body() updateDto: UpdateProofSubmissionStatusDto,
    @Request() req: any,
  ) {
    const userId = req.user.userId;
    
    // Get proof submission before updating status
    const proofSubmission = await this.proofSubmissionService.findByIdForAdmin(proofSubmissionId);

    // Update status
    const updated = await this.proofSubmissionService.updateStatus(
      proofSubmissionId,
      updateDto.status,
      userId,
      updateDto.comment,
    );

    // If status is accepted and proof submission is linked to a submission, copy to proofs table when submission is accepted
    // This will be handled when the submission itself is accepted
    return updated;
  }

  @Delete('submissions/:submissionId/proof-submissions/:proofSubmissionId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a proof submission for a content creator submission (admin - physical deletion)' })
  @ApiResponse({ status: 204, description: 'Proof submission deleted successfully' })
  async deleteProofSubmissionForSubmission(
    @Param('proofSubmissionId') proofSubmissionId: string,
  ) {
    await this.proofSubmissionService.deleteForAdmin(proofSubmissionId);
  }

}
