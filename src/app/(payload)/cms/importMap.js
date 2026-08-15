import { CollectionCards as CollectionCards_f9c02e79a4aed9a3924487c0cd4cafb1 } from '@payloadcms/next/rsc'
import { S3ClientUploadHandler as S3ClientUploadHandler_4d4b0f7d0c8a2a1e0d9f6b5c4a3e2d1 } from '@payloadcms/storage-s3/client'

/** @type import('payload').ImportMap */
export const importMap = {
  "@payloadcms/next/rsc#CollectionCards": CollectionCards_f9c02e79a4aed9a3924487c0cd4cafb1,
  // Required whenever @payloadcms/storage-s3 is in the config (including Preview/Production).
  // Local `payload generate:importmap` skips this if S3_* env vars are unset — keep it committed.
  "@payloadcms/storage-s3/client#S3ClientUploadHandler":
    S3ClientUploadHandler_4d4b0f7d0c8a2a1e0d9f6b5c4a3e2d1,
}
