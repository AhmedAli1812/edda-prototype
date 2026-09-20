# Storage Architecture & Abstraction

## Interface Definition
The storage engine provides an abstract contract `StorageService`:
- `uploadFile(file: Express.Multer.File, folder: StorageFolder): Promise<StorageUploadResult>`
- `deleteFile(key: string): Promise<boolean>`
- `getSignedUrl(key: string, expiresInSeconds: number): Promise<string>`

## Adapters
1. **`LocalStorageAdapter` (Default in Dev)**:
   - Stores files in `apps/api/uploads/`.
   - Generates local static asset URLs served by NestJS.
2. **`S3StorageAdapter` (Production)**:
   - S3-compatible object storage (AWS S3, Cloudflare R2, MinIO, Wasabi).
   - Generates secure pre-signed URLs for KYC and private dispute evidence.
