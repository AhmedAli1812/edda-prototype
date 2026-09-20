import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { StorageAdapter, UploadFileOptions, UploadFileResult } from './storage.interface';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class LocalStorageAdapter implements StorageAdapter {
  private readonly logger = new Logger('LocalStorageAdapter');
  private readonly rootDir: string;
  private readonly appUrl: string;

  constructor(private configService: ConfigService) {
    this.rootDir = path.resolve(this.configService.get<string>('STORAGE_LOCAL_ROOT', './uploads'));
    this.appUrl = this.configService.get<string>('APP_URL', 'http://localhost:4000');

    if (!fs.existsSync(this.rootDir)) {
      fs.mkdirSync(this.rootDir, { recursive: true });
    }
  }

  async uploadFile(options: UploadFileOptions): Promise<UploadFileResult> {
    const { buffer, filename, folder } = options;
    const folderPath = path.join(this.rootDir, folder);

    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath, { recursive: true });
    }

    const ext = path.extname(filename);
    const uniqueName = `${Date.now()}-${crypto.randomBytes(6).toString('hex')}${ext}`;
    const filePath = path.join(folderPath, uniqueName);

    await fs.promises.writeFile(filePath, buffer);

    const key = `${folder}/${uniqueName}`;
    const url = `${this.appUrl}/uploads/${key}`;

    this.logger.log(`Uploaded file locally: ${key} (${buffer.length} bytes)`);

    return {
      key,
      url,
      sizeBytes: buffer.length,
    };
  }

  async deleteFile(key: string): Promise<boolean> {
    const filePath = path.join(this.rootDir, key);
    if (fs.existsSync(filePath)) {
      await fs.promises.unlink(filePath);
      return true;
    }
    return false;
  }

  async getSignedUrl(key: string): Promise<string> {
    return `${this.appUrl}/uploads/${key}`;
  }
}
