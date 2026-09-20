export type StorageFolder =
  | 'service-photos'
  | 'product-images'
  | 'kyc-documents'
  | 'invoices'
  | 'dispute-evidence';

export interface UploadFileOptions {
  buffer: Buffer;
  filename: string;
  mimetype: string;
  folder: StorageFolder;
}

export interface UploadFileResult {
  key: string;
  url: string;
  sizeBytes: number;
}

export const STORAGE_ADAPTER = 'STORAGE_ADAPTER';

export interface StorageAdapter {
  uploadFile(options: UploadFileOptions): Promise<UploadFileResult>;
  deleteFile(key: string): Promise<boolean>;
  getSignedUrl(key: string, expiresInSeconds?: number): Promise<string>;
}
