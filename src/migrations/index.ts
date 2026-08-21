import * as migration_20260812_061650_sprint2_content from './20260812_061650_sprint2_content';
import * as migration_20260812_132324_media_original_filename from './20260812_132324_media_original_filename';
import * as migration_20260818_sprint5_provenance from './20260818_sprint5_provenance';
import * as migration_20260819_sprint5_content_origin_enums from './20260819_sprint5_content_origin_enums';
import * as migration_20260821_030052_sprint6_company_listings from './20260821_030052_sprint6_company_listings';

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
  {
    up: migration_20260818_sprint5_provenance.up,
    down: migration_20260818_sprint5_provenance.down,
    name: '20260818_sprint5_provenance',
  },
  {
    up: migration_20260819_sprint5_content_origin_enums.up,
    down: migration_20260819_sprint5_content_origin_enums.down,
    name: '20260819_sprint5_content_origin_enums',
  },
  {
    up: migration_20260821_030052_sprint6_company_listings.up,
    down: migration_20260821_030052_sprint6_company_listings.down,
    name: '20260821_030052_sprint6_company_listings'
  },
];
