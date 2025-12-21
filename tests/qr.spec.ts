import { describe, it, expect } from 'vitest';
import { validateQRCode, extractTokenFromQR, generateMemberQRCode } from '../src/lib/qr/generator';

describe('QR utils', () => {
  it('validates generated QR', async () => {
    const res = await generateMemberQRCode('test-id');
    expect(res.qrCodeString.startsWith('GYM|')).toBe(true);
    expect(validateQRCode(res.qrCodeString)).toBe(true);
    const token = extractTokenFromQR(res.qrCodeString);
    expect(token).toBe(res.token);
  });
});
