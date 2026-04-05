#!/usr/bin/env node
/**
 * אופטימיזציה של תמונות בבנייה
 * משתמש ב-Sharp לאופטימיזציה אוטומטית
 */

import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const publicDir = path.join(rootDir, 'public');
const imagesDir = path.join(publicDir, 'images');

const SUPPORTED_FORMATS = ['.jpg', '.jpeg', '.png', '.webp'];
const QUALITY = 85;
const MAX_WIDTH = 1920;

async function optimizeImage(inputPath, outputPath) {
  try {
    const image = sharp(inputPath);
    const metadata = await image.metadata();

    let pipeline = image;

    // Resize if too large
    if (metadata.width > MAX_WIDTH) {
      pipeline = pipeline.resize(MAX_WIDTH, null, {
        withoutEnlargement: true,
        fit: 'inside'
      });
    }

    // Convert to WebP for better compression
    if (path.extname(inputPath).toLowerCase() !== '.webp') {
      const webpPath = outputPath.replace(/\.[^.]+$/, '.webp');
      await pipeline
        .webp({ quality: QUALITY })
        .toFile(webpPath);
      console.log(`✅ Optimized: ${path.relative(rootDir, webpPath)}`);
    }

    // Also keep original format optimized
    await pipeline
      .jpeg({ quality: QUALITY, progressive: true })
      .toFile(outputPath);
    console.log(`✅ Optimized: ${path.relative(rootDir, outputPath)}`);

  } catch (error) {
    console.error(`❌ Failed to optimize ${inputPath}:`, error.message);
  }
}

async function processDirectory(dirPath) {
  const items = fs.readdirSync(dirPath);

  for (const item of items) {
    const itemPath = path.join(dirPath, item);
    const stat = fs.statSync(itemPath);

    if (stat.isDirectory()) {
      await processDirectory(itemPath);
    } else if (SUPPORTED_FORMATS.includes(path.extname(itemPath).toLowerCase())) {
      const relativePath = path.relative(imagesDir, itemPath);
      const outputPath = path.join(imagesDir, 'optimized', relativePath);

      // Ensure output directory exists
      fs.mkdirSync(path.dirname(outputPath), { recursive: true });

      await optimizeImage(itemPath, outputPath);
    }
  }
}

async function main() {
  console.log('🚀 Starting image optimization...');

  if (!fs.existsSync(imagesDir)) {
    console.log('No images directory found, skipping optimization');
    return;
  }

  await processDirectory(imagesDir);
  console.log('✨ Image optimization complete!');
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { optimizeImage, processDirectory };