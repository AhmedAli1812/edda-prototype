import { Module, Global } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { StorageService } from './storage.service';
import { STORAGE_ADAPTER } from './storage.interface';
import { LocalStorageAdapter } from './local-storage.adapter';
import { S3StorageAdapter } from './s3-storage.adapter';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    StorageService,
    {
      provide: STORAGE_ADAPTER,
      useFactory: (config: ConfigService) => {
        const driver = config.get<string>('STORAGE_DRIVER', 'local');
        return driver === 's3' ? new S3StorageAdapter(config) : new LocalStorageAdapter(config);
      },
      inject: [ConfigService],
    },
  ],
  exports: [StorageService, STORAGE_ADAPTER],
})
export class StorageModule {}
