import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import { STORAGE_ADAPTER, StorageAdapter, StorageFolder, UploadFileResult } from './storage.interface';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class StorageService {
  private readonly maxBytes: number;
  private readonly allowedMimeTypes = [
    'image/jpeg',
    'image/png',
    'image/webp',
    'application/pdf',
  ];

  constructor(
    @Inject(STORAGE_ADAPTER) private adapter: StorageAdapter,
    private configService: ConfigService,
  ) {
    const maxMb = this.configService.get<number>('STORAGE_MAX_FILE_SIZE_MB', 10);
    this.maxBytes = maxMb * 1024 * 1024;
  }

  async upload(
    file: { buffer: Buffer; originalname: string; mimetype: string; size: number },
    folder: StorageFolder,
  ): Promise<UploadFileResult> {
    if (!file) {
      throw new BadRequestException('الملف مطلوب');
    }

    if (!this.allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException('نوع الملف غير مدعوم. يُسمح فقط بالصور (JPEG, PNG, WebP) وملفات PDF');
    }

    if (file.size > this.maxBytes) {
      throw new BadRequestException(`حجم الملف يتجاوز الحد المسموح به (${this.maxBytes / (1024 * 1024)} ميجابايت)`);
    }

    return this.adapter.uploadFile({
      buffer: file.buffer,
      filename: file.originalname,
      mimetype: file.mimetype,
      folder,
    });
  }

  async delete(key: string): Promise<boolean> {
    return this.adapter.deleteFile(key);
  }

  async getSignedUrl(key: string, expiresInSeconds: number = 3600): Promise<string> {
    return this.adapter.getSignedUrl(key, expiresInSeconds);
  }
}
