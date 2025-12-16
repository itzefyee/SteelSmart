import fs from 'fs/promises';
import path from 'path';

const PRODUCTS_DIR = path.join(process.cwd(), 'public', 'product-images');

type ProductRenameConfig = {
  folder: string;
  previewSource: string;
};

const PRODUCTS_TO_NORMALIZE: ProductRenameConfig[] = [
  {
    folder: 'brake_rotor',
    previewSource: 'iso-back-top-right',
  },
  {
    folder: 'gallows_frame',
    previewSource: 'iso-front-bottom-right',
  },
  {
    folder: 'surgical_drill_guide',
    previewSource: 'iso-back-bottom-left',
  },
];

const LEGACY_FILE_PATTERN = /(?:.+_)?(.+?)_view\.png$/i;

async function normalizeFolder(config: ProductRenameConfig) {
  const folderPath = path.join(PRODUCTS_DIR, config.folder);
  const files = await fs.readdir(folderPath);

  for (const file of files) {
    const legacyMatch = file.match(LEGACY_FILE_PATTERN);
    if (!legacyMatch) {
      // Already normalized, skip
      continue;
    }

    const legacyView = legacyMatch[1];
    const normalizedView = legacyView.replace(/_/g, '-');
    const newName = `${normalizedView}.png`;

    const oldPath = path.join(folderPath, file);
    const newPath = path.join(folderPath, newName);

    await fs.rename(oldPath, newPath);
    console.log(`✅ ${config.folder}: ${file} → ${newName}`);
  }

  // Create/replace preview.png from designated source
  const previewSourcePath = path.join(folderPath, `${config.previewSource}.png`);
  const previewDestPath = path.join(folderPath, 'preview.png');

  await fs.copyFile(previewSourcePath, previewDestPath);
  console.log(`⭐ ${config.folder}: preview.png updated from ${config.previewSource}.png`);
}

async function main() {
  for (const product of PRODUCTS_TO_NORMALIZE) {
    await normalizeFolder(product);
  }

  console.log('\n🎯 Image normalization complete');
}

main().catch((error) => {
  console.error('❌ Failed to normalize product images', error);
  process.exit(1);
});

