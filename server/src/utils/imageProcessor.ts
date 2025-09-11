import fs from 'fs/promises';
import path from 'path';
import { config } from '../config/environment';

/**
 * Image processing utility for handling selfie images
 */
export class ImageProcessor {
  private static readonly UPLOAD_DIR = config.upload.path;
  private static readonly MAX_SIZE = config.upload.maxSize;
  private static readonly ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

  /**
   * Ensure upload directory exists
   */
  private static async ensureUploadDir(): Promise<void> {
    try {
      await fs.access(this.UPLOAD_DIR);
    } catch {
      await fs.mkdir(this.UPLOAD_DIR, { recursive: true });
    }
  }

  /**
   * Generate unique filename for selfie image
   */
  private static generateFilename(employeeId: string, sessionType: string): string {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const extension = 'jpg'; // Default to jpg for selfies
    return `selfie_${employeeId}_${sessionType}_${timestamp}.${extension}`;
  }

  /**
   * Process and save base64 selfie image
   */
  static async processSelfieImage(
    base64Data: string, 
    employeeId: string, 
    sessionType: string
  ): Promise<{
    filePath: string;
    fileName: string;
    fileSize: number;
  }> {
    try {
      // Validate base64 data
      if (!base64Data || !base64Data.startsWith('data:image/')) {
        throw new Error('Invalid base64 image data');
      }

      // Extract image data and metadata
      const matches = base64Data.match(/^data:image\/([a-zA-Z]+);base64,(.+)$/);
      if (!matches) {
        throw new Error('Invalid base64 image format');
      }

      const [, imageType, imageData] = matches;
      const mimeType = `image/${imageType}`;

      // Validate image type
      if (!this.ALLOWED_TYPES.includes(mimeType)) {
        throw new Error(`Unsupported image type: ${mimeType}`);
      }

      // Convert base64 to buffer
      const buffer = Buffer.from(imageData, 'base64');
      
      // Validate file size
      if (buffer.length > this.MAX_SIZE) {
        throw new Error(`Image size exceeds maximum allowed size of ${this.MAX_SIZE} bytes`);
      }

      // Ensure upload directory exists
      await this.ensureUploadDir();

      // Generate filename and file path
      const fileName = this.generateFilename(employeeId, sessionType);
      const filePath = path.join(this.UPLOAD_DIR, fileName);

      // Save file
      await fs.writeFile(filePath, buffer);

      return {
        filePath,
        fileName,
        fileSize: buffer.length
      };
    } catch (error) {
      console.error('Error processing selfie image:', error);
      throw new Error(`Failed to process selfie image: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Delete selfie image file
   */
  static async deleteSelfieImage(filePath: string): Promise<void> {
    try {
      await fs.unlink(filePath);
    } catch (error) {
      console.error('Error deleting selfie image:', error);
      // Don't throw error for file deletion failures
    }
  }

  /**
   * Get selfie image as base64 (for API responses)
   */
  static async getSelfieImageAsBase64(filePath: string): Promise<string | null> {
    try {
      const buffer = await fs.readFile(filePath);
      const mimeType = this.getMimeTypeFromPath(filePath);
      return `data:${mimeType};base64,${buffer.toString('base64')}`;
    } catch (error) {
      console.error('Error reading selfie image:', error);
      return null;
    }
  }

  /**
   * Get MIME type from file path
   */
  private static getMimeTypeFromPath(filePath: string): string {
    const ext = path.extname(filePath).toLowerCase();
    switch (ext) {
      case '.jpg':
      case '.jpeg':
        return 'image/jpeg';
      case '.png':
        return 'image/png';
      case '.webp':
        return 'image/webp';
      default:
        return 'image/jpeg';
    }
  }

  /**
   * Clean up old selfie images based on retention policy
   */
  static async cleanupOldSelfies(): Promise<number> {
    try {
      const retentionDays = config.upload.selfieRetentionDays;
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

      const files = await fs.readdir(this.UPLOAD_DIR);
      let deletedCount = 0;

      for (const file of files) {
        if (file.startsWith('selfie_')) {
          const filePath = path.join(this.UPLOAD_DIR, file);
          const stats = await fs.stat(filePath);
          
          if (stats.mtime < cutoffDate) {
            await this.deleteSelfieImage(filePath);
            deletedCount++;
          }
        }
      }

      return deletedCount;
    } catch (error) {
      console.error('Error cleaning up old selfies:', error);
      return 0;
    }
  }

  /**
   * Validate base64 image data
   */
  static validateBase64Image(base64Data: string): {
    isValid: boolean;
    error?: string;
    mimeType?: string;
    size?: number;
  } {
    try {
      if (!base64Data || !base64Data.startsWith('data:image/')) {
        return { isValid: false, error: 'Invalid base64 image data' };
      }

      const matches = base64Data.match(/^data:image\/([a-zA-Z]+);base64,(.+)$/);
      if (!matches) {
        return { isValid: false, error: 'Invalid base64 image format' };
      }

      const [, imageType, imageData] = matches;
      const mimeType = `image/${imageType}`;

      if (!this.ALLOWED_TYPES.includes(mimeType)) {
        return { isValid: false, error: `Unsupported image type: ${mimeType}` };
      }

      const buffer = Buffer.from(imageData, 'base64');
      if (buffer.length > this.MAX_SIZE) {
        return { 
          isValid: false, 
          error: `Image size exceeds maximum allowed size of ${this.MAX_SIZE} bytes` 
        };
      }

      return {
        isValid: true,
        mimeType,
        size: buffer.length
      };
    } catch (error) {
      return { 
        isValid: false, 
        error: error instanceof Error ? error.message : 'Unknown validation error' 
      };
    }
  }
}
