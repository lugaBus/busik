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
  BadRequestException,
  UseInterceptors,
  UploadedFile,
  Logger,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiHeader, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { unlinkSync } from 'fs';
import { ContentCreatorSubmissionService } from './services/content-creator-submission.service';
import { AnonymousSessionService } from './services/anonymous-session.service';
import { CreateContentCreatorSubmissionDto } from './dto/create-content-creator-submission.dto';
import { UpdateContentCreatorSubmissionDto } from './dto/update-content-creator-submission.dto';
import { OptionalJwtAuthGuard } from '../proof-submissions/guards/optional-jwt-auth.guard';
import { ContentCreatorSubmissionOwnershipGuard } from './guards/content-creator-submission-ownership.guard';
import { validateImageFile } from '../../../utils/file-validator';

@ApiTags('Public - Content Creator Submissions')
@Controller('public/content-creator-submissions')
export class ContentCreatorSubmissionsController {
  private readonly logger = new Logger(ContentCreatorSubmissionsController.name);

  constructor(
    private readonly contentCreatorSubmissionService: ContentCreatorSubmissionService,
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

  @Post(':id/photo')
  @UseGuards(OptionalJwtAuthGuard, ContentCreatorSubmissionOwnershipGuard)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './public/uploads/content-creator-submissions',
        filename: (req, file, cb) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname);
          cb(null, `content-creator-submission-${uniqueSuffix}${ext}`);
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
  @ApiOperation({ summary: 'Upload photo for content creator submission' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
        index: {
          type: 'number',
          description: 'Photo index (0-3)',
        },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Photo uploaded successfully' })
  @ApiResponse({ status: 400, description: 'Invalid file' })
  @ApiResponse({ status: 404, description: 'Content creator submission not found' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiHeader({
    name: 'x-submitter-id',
    required: false,
    description: 'Anonymous submitter ID (required if not authenticated)',
  })
  async uploadPhoto(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
    @Request() req: any,
    @Headers('x-submitter-id') submitterId?: string,
    @Body('index') index?: number,
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }
    const userId = req.user?.userId;
    
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
    
    // Get current submission
    const submission = await this.contentCreatorSubmissionService.findOne(id, submitterId, userId);
    const currentPhotoUrls = (submission.photoUrls as string[]) || [];
    
    // Add new photo URL
    const photoUrl = `/public/uploads/content-creator-submissions/${file.filename}`;
    const photoIndex = index !== undefined ? parseInt(String(index)) : currentPhotoUrls.length;
    
    // Ensure we don't exceed 4 photos
    if (photoIndex >= 4) {
      // Delete uploaded file if limit exceeded
      try {
        unlinkSync(filePath);
      } catch (unlinkError) {
        // Ignore unlink errors
      }
      throw new BadRequestException('Maximum 4 photos allowed');
    }
    
    // Update photoUrls array
    const updatedPhotoUrls = [...currentPhotoUrls];
    if (photoIndex < updatedPhotoUrls.length) {
      updatedPhotoUrls[photoIndex] = photoUrl;
    } else {
      updatedPhotoUrls.push(photoUrl);
    }
    
    return this.contentCreatorSubmissionService.update(id, { photoUrls: updatedPhotoUrls }, submitterId, userId);
  }

  @Post()
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({ summary: 'Create a content creator submission' })
  @ApiResponse({ status: 201, description: 'Content creator submission created' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiHeader({
    name: 'x-submitter-id',
    required: false,
    description: 'Anonymous submitter ID (required if not authenticated)',
  })
  @ApiHeader({
    name: 'x-language',
    required: false,
    description: 'Current language (en, ua, ru) - used for i18n fields',
  })
  async create(
    @Body() createDto: CreateContentCreatorSubmissionDto,
    @Request() req: any,
    @Headers('x-submitter-id') submitterId?: string,
    @Headers('x-language') language?: string,
  ) {
    const userId = req.user?.userId;
    
    // Logging for debugging using NestJS Logger
    this.logger.log(`[CREATE] Request received - hasUser: ${!!req.user}, userId: ${userId}, submitterId: ${submitterId}, authHeader: ${req.headers?.authorization ? 'present' : 'missing'}`);
    
    if (!userId && !submitterId) {
      throw new BadRequestException('Either authentication or x-submitter-id header is required');
    }

    if (submitterId && !this.anonymousSessionService.isValidSubmitterId(submitterId)) {
      throw new BadRequestException('Invalid submitter-id format');
    }

    // If user is authenticated, ignore submitterId to avoid confusion
    const finalSubmitterId = userId ? undefined : submitterId;
    this.logger.log(`[CREATE] Final values - userId: ${userId}, finalSubmitterId: ${finalSubmitterId}, willUseUserId: ${!!userId}`);

    return this.contentCreatorSubmissionService.create(createDto, finalSubmitterId, userId);
  }

  @Get()
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({ summary: 'Get all content creator submissions for current user/submitter' })
  @ApiResponse({ status: 200, description: 'List of content creator submissions' })
  @ApiHeader({
    name: 'x-submitter-id',
    required: false,
    description: 'Anonymous submitter ID (required if not authenticated)',
  })
  async findAll(
    @Request() req: any,
    @Headers('x-submitter-id') submitterId?: string,
  ) {
    const userId = req.user?.userId;
    return this.contentCreatorSubmissionService.findAll(submitterId, userId);
  }

  @Get(':id')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({ summary: 'Get a content creator submission by ID' })
  @ApiResponse({ status: 200, description: 'Content creator submission found' })
  @ApiResponse({ status: 404, description: 'Content creator submission not found' })
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
    return this.contentCreatorSubmissionService.findOne(id, submitterId, userId);
  }

  @Patch(':id')
  @UseGuards(OptionalJwtAuthGuard, ContentCreatorSubmissionOwnershipGuard)
  @ApiOperation({ summary: 'Update a content creator submission' })
  @ApiResponse({ status: 200, description: 'Content creator submission updated' })
  @ApiResponse({ status: 404, description: 'Content creator submission not found' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiHeader({
    name: 'x-submitter-id',
    required: false,
    description: 'Anonymous submitter ID (required if not authenticated)',
  })
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateContentCreatorSubmissionDto,
    @Request() req: any,
    @Headers('x-submitter-id') submitterId?: string,
  ) {
    const userId = req.user?.userId;
    return this.contentCreatorSubmissionService.update(id, updateDto, submitterId, userId);
  }

  @Delete(':id')
  @UseGuards(OptionalJwtAuthGuard, ContentCreatorSubmissionOwnershipGuard)
  @ApiOperation({ summary: 'Delete a content creator submission' })
  @ApiResponse({ status: 200, description: 'Content creator submission deleted' })
  @ApiResponse({ status: 404, description: 'Content creator submission not found' })
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
    return this.contentCreatorSubmissionService.remove(id, submitterId, userId);
  }
}
