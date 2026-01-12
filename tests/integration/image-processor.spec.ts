import fs from 'fs/promises';
import { describe, it, expect, afterAll } from 'vitest';
import { processMemberImage, removeMemberImages } from '../../src/lib/image/processor';

// tiny 1x1 PNG base64 (valid minimal PNG)
const tinyPngBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGNgYAAAAAMAAWgmWQ0AAAAASUVORK5CYII=';

describe('image processor', () => {
  const userId = `test-${Date.now()}`;
  it('processes tiny png and writes main + thumb', async () => {
    const buffer = Buffer.from(tinyPngBase64, 'base64');
    const result = await processMemberImage(buffer, 'tiny.png', userId);
    expect(result).toHaveProperty('imagePath');
    expect(result).toHaveProperty('thumbPath');

    // Check files exist on disk
    const imgStat = await fs.stat(`.${result.imagePath}`);
    const thumbStat = await fs.stat(`.${result.thumbPath}`);
    expect(imgStat.size).toBeGreaterThan(0);
    expect(thumbStat.size).toBeGreaterThan(0);
  });

  afterAll(async () => {
    await removeMemberImages(userId);
  });
});
