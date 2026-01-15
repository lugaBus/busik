import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Request,
  UseGuards,
  Headers,
  Query,
  BadRequestException,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiHeader, ApiQuery, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { unlinkSync } from 'fs';
import { ProofSubmissionService } from './services/proof-submission.service';
import { AnonymousSessionService } from './services/anonymous-session.service';
import { CreateProofSubmissionDto } from './dto/create-proof-submission.dto';
import { UpdateProofSubmissionDto } from './dto/update-proof-submission.dto';
import { OptionalJwtAuthGuard } from './guards/optional-jwt-auth.guard';
import { ProofSubmissionOwnershipGuard } from './guards/proof-submission-ownership.guard';
import { validateImageFile } from '../../../utils/file-validator';

@ApiTags('Public - Proof Submissions')
@Controller('public/proof-submissions')
export class ProofSubmissionsController {
  constructor(
    private readonly proofSubmissionService: ProofSubmissionService,
    private readonly anonymousSessionService: AnonymousSessionService,
  ) {}

  @Post('anonymous-session')
  @ApiOperation({ summary: 'Generate a new anonymous session ID' })
  @ApiResponse({ status: 201, description: 'Anonymous session ID generated' })
  async generateAnonymousSession() {
    const submitterId = this.anonymousSessionService.generateSubmitterId();
    await this.anonymousSessionService.getOrCreateSession(submitterId);
    return { submitterId };
  }

  @Post(':id/image')
  @UseGuards(OptionalJwtAuthGuard, ProofSubmissionOwnershipGuard)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './public/uploads/proof-submissions',
        filename: (req, file, cb) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname);
          cb(null, `proof-submission-${uniqueSuffix}${ext}`);
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
  @ApiOperation({ summary: 'Upload image for proof submission' })
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
  @ApiResponse({ status: 404, description: 'Proof submission not found' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiHeader({
    name: 'x-submitter-id',
    required: false,
    description: 'Anonymous submitter ID (required if not authenticated)',
  })
  async uploadProofSubmissionImage(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
    @Request() req: any,
    @Headers('x-submitter-id') submitterId?: string,
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }
    const userId = req.user?.userId;
    
    // Validate file by checking magic bytes (real file content)
    const filePath = join(process.cwd(), 'public', 'uploads', 'proof-submissions', file.filename);
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
    
    const imageUrl = `/public/uploads/proof-submissions/${file.filename}`;
    return this.proofSubmissionService.update(id, { imageUrl }, submitterId, userId);
  }

  @Post()
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({ summary: 'Create a proof submission' })
  @ApiResponse({ status: 201, description: 'Proof submission created' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiHeader({
    name: 'x-submitter-id',
    required: false,
    description: 'Anonymous submitter ID (required if not authenticated)',
  })
  @ApiHeader({
    name: 'x-language',
    required: false,
    description: 'Current language (en, ua, ru) - used for description field',
  })
  async create(
    @Body() createDto: CreateProofSubmissionDto,
    @Request() req: any,
    @Headers('x-submitter-id') submitterId?: string,
    @Headers('x-language') language?: string,
  ) {
    const userId = req.user?.userId;
    
    if (!userId && !submitterId) {
      throw new BadRequestException('Either authentication or x-submitter-id header is required');
    }

    if (submitterId && !this.anonymousSessionService.isValidSubmitterId(submitterId)) {
      throw new BadRequestException('Invalid submitter-id format');
    }

    // If description is provided, ensure it's in the correct format
    // If language header is provided and description is a simple object, use that language
    if (createDto.description && typeof createDto.description === 'object') {
      // If description already has language keys, keep it as is
      // Otherwise, if language header is provided, wrap the value
      if (language && Object.keys(createDto.description).length === 1) {
        const value = Object.values(createDto.description)[0];
        if (typeof value === 'string') {
          createDto.description = { [language]: value };
        }
      }
    }

    return this.proofSubmissionService.create(createDto, submitterId, userId);
  }

  @Get()
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({ summary: 'Get all proof submissions for a content creator or submission' })
  @ApiQuery({ name: 'contentCreatorId', required: false, type: String, description: 'Content creator ID' })
  @ApiQuery({ name: 'contentCreatorSubmissionId', required: false, type: String, description: 'Content creator submission ID' })
  @ApiResponse({ status: 200, description: 'List of proof submissions' })
  @ApiHeader({
    name: 'x-submitter-id',
    required: false,
    description: 'Anonymous submitter ID (required if not authenticated)',
  })
  async findAll(
    @Request() req: any,
    @Query('contentCreatorId') contentCreatorId?: string,
    @Query('contentCreatorSubmissionId') contentCreatorSubmissionId?: string,
    @Headers('x-submitter-id') submitterId?: string,
  ) {
    const userId = req.user?.userId;
    if (!contentCreatorId && !contentCreatorSubmissionId) {
      throw new BadRequestException('Either contentCreatorId or contentCreatorSubmissionId is required');
    }
    return this.proofSubmissionService.findAll(contentCreatorId, contentCreatorSubmissionId, submitterId, userId);
  }

  @Get(':id')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({ summary: 'Get a proof submission by ID' })
  @ApiResponse({ status: 200, description: 'Proof submission found' })
  @ApiResponse({ status: 404, description: 'Proof submission not found' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiHeader({
    name: 'x-submitter-id',
    required: false,
    description: 'Anonymous submitter ID (required if not authenticated)',
  })
  async findOne(
    @Param('id') id: string,
    @Request() req: any,
    @Headers('x-submitter-id') submitterId?: string,
  ) {
    const userId = req.user?.userId;
    return this.proofSubmissionService.findOne(id, submitterId, userId);
  }

  @Patch(':id')
  @UseGuards(OptionalJwtAuthGuard, ProofSubmissionOwnershipGuard)
  @ApiOperation({ summary: 'Update a proof submission' })
  @ApiResponse({ status: 200, description: 'Proof submission updated' })
  @ApiResponse({ status: 404, description: 'Proof submission not found' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiHeader({
    name: 'x-submitter-id',
    required: false,
    description: 'Anonymous submitter ID (required if not authenticated)',
  })
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateProofSubmissionDto,
    @Request() req: any,
    @Headers('x-submitter-id') submitterId?: string,
  ) {
    const userId = req.user?.userId;
    return this.proofSubmissionService.update(id, updateDto, submitterId, userId);
  }

  @Delete(':id')
  @UseGuards(OptionalJwtAuthGuard, ProofSubmissionOwnershipGuard)
  @ApiOperation({ summary: 'Delete a proof submission' })
  @ApiResponse({ status: 200, description: 'Proof submission deleted' })
  @ApiResponse({ status: 404, description: 'Proof submission not found' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiHeader({
    name: 'x-submitter-id',
    required: false,
    description: 'Anonymous submitter ID (required if not authenticated)',
  })
  async remove(
    @Param('id') id: string,
    @Request() req: any,
    @Headers('x-submitter-id') submitterId?: string,
  ) {
    const userId = req.user?.userId;
    return this.proofSubmissionService.remove(id, submitterId, userId);
  }
}
