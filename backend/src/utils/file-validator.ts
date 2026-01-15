import { BadRequestException } from '@nestjs/common';
import { readFileSync } from 'fs';

/**
 * Magic bytes (file signatures) for supported image formats
 */
const IMAGE_SIGNATURES: { [key: string]: number[][] } = {
  jpeg: [
    [0xff, 0xd8, 0xff], // JPEG standard
  ],
  png: [
    [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a], // PNG standard
  ],
  gif: [
    [0x47, 0x49, 0x46, 0x38, 0x37, 0x61], // GIF87a
    [0x47, 0x49, 0x46, 0x38, 0x39, 0x61], // GIF89a
  ],
  webp: [
    // WebP: RIFF (4 bytes) + file size (4 bytes) + WEBP (4 bytes)
    // We check for RIFF at position 0 and WEBP at position 8
    [0x52, 0x49, 0x46, 0x46], // RIFF
  ],
};

/**
 * Allowed MIME types
 */
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp',
];

/**
 * Validates file by checking magic bytes (file signature)
 * @param filePath - Path to the uploaded file
 * @param originalMimeType - MIME type from request (for additional validation)
 * @returns true if file is valid image, throws BadRequestException otherwise
 */
export function validateImageFile(
  filePath: string,
  originalMimeType?: string,
): boolean {
  try {
    // Read first 12 bytes (enough to detect all supported formats)
    const buffer = readFileSync(filePath);
    const fileHeader = Array.from(buffer.slice(0, 12));

    // Check MIME type if provided
    if (originalMimeType && !ALLOWED_MIME_TYPES.includes(originalMimeType)) {
      throw new BadRequestException(
        `Invalid MIME type: ${originalMimeType}. Only image files are allowed.`,
      );
    }

    // Check JPEG
    if (
      IMAGE_SIGNATURES.jpeg.some((signature) =>
        signature.every((byte, index) => fileHeader[index] === byte),
      )
    ) {
      return true;
    }

    // Check PNG
    if (
      IMAGE_SIGNATURES.png.some((signature) =>
        signature.every((byte, index) => fileHeader[index] === byte),
      )
    ) {
      return true;
    }

    // Check GIF
    if (
      IMAGE_SIGNATURES.gif.some((signature) =>
        signature.every((byte, index) => fileHeader[index] === byte),
      )
    ) {
      return true;
    }

    // Check WebP (RIFF at start, WEBP at position 8)
    if (
      IMAGE_SIGNATURES.webp[0].every((byte, index) => fileHeader[index] === byte)
    ) {
      // Check for WEBP string at position 8
      const webpString = String.fromCharCode(
        ...fileHeader.slice(8, 12),
      ).toUpperCase();
      if (webpString === 'WEBP') {
        return true;
      }
    }

    // File doesn't match any known image signature
    throw new BadRequestException(
      'Invalid file format. File does not appear to be a valid image (JPEG, PNG, GIF, or WebP).',
    );
  } catch (error) {
    if (error instanceof BadRequestException) {
      throw error;
    }
    throw new BadRequestException(
      `Failed to validate file: ${error instanceof Error ? error.message : 'Unknown error'}`,
    );
  }
}

/**
 * Validates file buffer by checking magic bytes
 * Useful for validation before saving file to disk
 * @param buffer - File buffer
 * @param originalMimeType - MIME type from request (for additional validation)
 * @returns true if file is valid image, throws BadRequestException otherwise
 */
export function validateImageBuffer(
  buffer: Buffer,
  originalMimeType?: string,
): boolean {
  try {
    // Read first 12 bytes
    const fileHeader = Array.from(buffer.slice(0, 12));

    // Check MIME type if provided
    if (originalMimeType && !ALLOWED_MIME_TYPES.includes(originalMimeType)) {
      throw new BadRequestException(
        `Invalid MIME type: ${originalMimeType}. Only image files are allowed.`,
      );
    }

    // Check JPEG
    if (
      IMAGE_SIGNATURES.jpeg.some((signature) =>
        signature.every((byte, index) => fileHeader[index] === byte),
      )
    ) {
      return true;
    }

    // Check PNG
    if (
      IMAGE_SIGNATURES.png.some((signature) =>
        signature.every((byte, index) => fileHeader[index] === byte),
      )
    ) {
      return true;
    }

    // Check GIF
    if (
      IMAGE_SIGNATURES.gif.some((signature) =>
        signature.every((byte, index) => fileHeader[index] === byte),
      )
    ) {
      return true;
    }

    // Check WebP (RIFF at start, WEBP at position 8)
    if (
      IMAGE_SIGNATURES.webp[0].every((byte, index) => fileHeader[index] === byte)
    ) {
      // Check for WEBP string at position 8
      const webpString = String.fromCharCode(
        ...fileHeader.slice(8, 12),
      ).toUpperCase();
      if (webpString === 'WEBP') {
        return true;
      }
    }

    // File doesn't match any known image signature
    throw new BadRequestException(
      'Invalid file format. File does not appear to be a valid image (JPEG, PNG, GIF, or WebP).',
    );
  } catch (error) {
    if (error instanceof BadRequestException) {
      throw error;
    }
    throw new BadRequestException(
      `Failed to validate file: ${error instanceof Error ? error.message : 'Unknown error'}`,
    );
  }
}
