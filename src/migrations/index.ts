import * as migration_20260812_061650_sprint2_content from './20260812_061650_sprint2_content';
import * as migration_20260812_132324_media_original_filename from './20260812_132324_media_original_filename';

export const migrations = [
  {
    up: migration_20260812_061650_sprint2_content.up,
    down: migration_20260812_061650_sprint2_content.down,
    name: '20260812_061650_sprint2_content',
  },
  {
    up: migration_20260812_132324_media_original_filename.up,
    down: migration_20260812_132324_media_original_filename.down,
    name: '20260812_132324_media_original_filename',
  },
];
