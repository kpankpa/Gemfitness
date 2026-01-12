import fs from 'fs/promises';
import path from 'path';
import sharp from 'sharp';

const MAX_BYTES = 2 * 1024 * 1024; // 2MB
const IMAGES_DIR = path.join(process.cwd(), 'public', 'images', 'members');

export class ImageValidationError extends Error {
  code: string;
  constructor(code: string, message: string) {
    super(message);
    this.code = code;
  }
}

export async function processMemberImage(buffer: Buffer, _originalName: string, userId: string) {
  if (!buffer || !Buffer.isBuffer(buffer)) throw new ImageValidationError('NO_FILE', 'No file buffer provided');
  if (buffer.length > MAX_BYTES) throw new ImageValidationError('FILE_TOO_LARGE', 'File exceeds maximum allowed size');

  // Ensure images dir exists
  await fs.mkdir(IMAGES_DIR, { recursive: true });

  // Probe image format using sharp
  let metadata;
  try {
    metadata = await sharp(buffer).metadata();
  } catch {
    throw new ImageValidationError('INVALID_IMAGE', 'Uploaded file is not a valid image');
  }

  const format = (metadata.format || 'jpeg').toLowerCase();
  if (!['jpeg', 'jpg', 'png', 'webp'].includes(format)) {
    throw new ImageValidationError('UNSUPPORTED_FORMAT', 'Only JPEG, PNG and WEBP are supported');
  }

  // Normalize extension
  const ext = format === 'jpeg' ? 'jpg' : format;
  const filename = `${userId}.${ext}`;
  const thumbName = `${userId}-thumb.${ext}`;
  const filePath = path.join(IMAGES_DIR, filename);
  const thumbPath = path.join(IMAGES_DIR, thumbName);

  // Resize main image to max 1024 (preserve aspect) and convert to jpeg/webp/png accordingly
  let mainPipeline = sharp(buffer).rotate().resize({ width: 1024, height: 1024, fit: 'inside' });
  if (ext === 'jpg') mainPipeline = mainPipeline.jpeg({ quality: 80 });
  else if (ext === 'png') mainPipeline = mainPipeline.png({ quality: 80 });
  else if (ext === 'webp') mainPipeline = mainPipeline.webp({ quality: 80 });

  // Thumbnail: 256x256 center-crop
  let thumbPipeline = sharp(buffer).rotate().resize(256, 256, { fit: 'cover', position: 'center' });
  if (ext === 'jpg') thumbPipeline = thumbPipeline.jpeg({ quality: 75 });
  else if (ext === 'png') thumbPipeline = thumbPipeline.png({ quality: 75 });
  else if (ext === 'webp') thumbPipeline = thumbPipeline.webp({ quality: 75 });

  // Write files
  try {
    await Promise.all([
      mainPipeline.toFile(filePath),
      thumbPipeline.toFile(thumbPath)
    ]);
  } catch {
    throw new ImageValidationError('SAVE_FAILED', 'Failed to process and save image');
  }

  return {
    imagePath: `/images/members/${filename}`,
    thumbPath: `/images/members/${thumbName}`
  };
}

export async function removeMemberImages(userId: string) {
  try {
    const files = await fs.readdir(IMAGES_DIR).catch(() => []);
    const matches = files.filter(f => f.startsWith(`${userId}.`) || f.startsWith(`${userId}-thumb.`));
    await Promise.all(matches.map(f => fs.unlink(path.join(IMAGES_DIR, f)).catch(() => {})));
  } catch {
    // ignore
  }
}
