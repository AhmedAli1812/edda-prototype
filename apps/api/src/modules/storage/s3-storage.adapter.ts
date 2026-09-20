import { Injectable, Logger } from '@nestjs/common';
import { StorageAdapter, UploadFileOptions, UploadFileResult } from './storage.interface';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class S3StorageAdapter implements StorageAdapter {
  private readonly logger = new Logger('S3StorageAdapter');
  private readonly bucket: string;

  constructor(private configService: ConfigService) {
    this.bucket = this.configService.get<string>('AWS_S3_BUCKET_NAME', 'edda-marketplace-assets');
  }

  async uploadFile(options: UploadFileOptions): Promise<UploadFileResult> {
    const key = `${options.folder}/${Date.now()}-${options.filename}`;
    this.logger.log(`[S3 Storage Scaffold] Uploading ${key} to bucket ${this.bucket}`);

    // Prepared for @aws-sdk/client-s3 integration in production deployment
    return {
      key,
      url: `https://${this.bucket}.s3.amazonaws.com/${key}`,
      sizeBytes: options.buffer.length,
    };
  }

  async deleteFile(key: string): Promise<boolean> {
    this.logger.log(`[S3 Storage Scaffold] Deleting ${key} from bucket ${this.bucket}`);
    return true;
  }

  async getSignedUrl(key: string, expiresInSeconds: number = 3600): Promise<string> {
    return `https://${this.bucket}.s3.amazonaws.com/${key}?signed=true&expires=${expiresInSeconds}`;
  }
}
