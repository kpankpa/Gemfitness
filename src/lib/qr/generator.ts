import QRCode from 'qrcode';
import { nanoid } from 'nanoid';

/**
 * Generate a unique QR code for a member
 * Returns both the QR code data URL and the unique code string
 */
export async function generateMemberQRCode(userId: string): Promise<{
  qrCodeData: string;
  qrCodeString: string;
}> {
  // Generate a unique code combining userId with a random string
  const qrCodeString = `GYM-${userId}-${nanoid(10)}`;

  try {
    // Generate QR code as data URL
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
 * Validate QR code format
 */
export function validateQRCode(qrCode: string): boolean {
  // Check if QR code matches our format: GYM-{userId}-{nanoId}
  const qrPattern = /^GYM-[a-f0-9-]{36}-[a-zA-Z0-9_-]{10}$/;
  return qrPattern.test(qrCode);
}

/**
 * Extract user ID from QR code
 */
export function extractUserIdFromQR(qrCode: string): string | null {
  if (!validateQRCode(qrCode)) {
    return null;
  }

  const parts = qrCode.split('-');
  // QR format: GYM-{uuid-with-dashes}-{nanoid}
  // Extract UUID (parts 1-5)
  return parts.slice(1, 6).join('-');
}
