import QRCode from 'qrcode';
import { nanoid } from 'nanoid';

/**
 * New QR format: `GYM|<token>` where `<token>` is a nanoid stored in `User.qrCode`.
 * This avoids embedding user IDs in the QR payload and makes lookup/simple rotation easier.
 */
export async function generateMemberQRCode(userId: string): Promise<{
  qrCodeData: string;
  qrCodeString: string;
  token: string;
}> {
  // Generate a random token to store in DB and embed in the QR payload
  const token = nanoid(24);
  const qrCodeString = `GYM|${token}`;

  try {
    const qrCodeData = await QRCode.toDataURL(qrCodeString, {
      errorCorrectionLevel: 'H',
      type: 'image/png',
      width: 300,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
    });

    return {
      qrCodeData,
      qrCodeString,
      token,
    };
  } catch (error) {
    console.error('Failed to generate QR code:', error);
    throw new Error('QR code generation failed');
  }
}

/**
 * Generate QR code as buffer for storage
 */
export async function generateQRCodeBuffer(data: string): Promise<Buffer> {
  try {
    return await QRCode.toBuffer(data, {
      errorCorrectionLevel: 'H',
      type: 'png',
      width: 300,
      margin: 2,
    });
  } catch (error) {
    console.error('Failed to generate QR code buffer:', error);
    throw new Error('QR code buffer generation failed');
  }
}

/**
 * Validate new QR code format `GYM|<token>`
 */
export function validateQRCode(qrCode: string): boolean {
  // Token is generated with nanoid(24) so expect exactly 24 characters
  const qrPattern = /^GYM\|[A-Za-z0-9_-]{24}$/;
  return qrPattern.test(qrCode);
}

/**
 * Extract token from QR code. Returns the token or null if invalid.
 */
export function extractTokenFromQR(qrCode: string): string | null {
  if (!validateQRCode(qrCode)) return null;
  const parts = qrCode.split('|');
  return parts[1] ?? null;
}
