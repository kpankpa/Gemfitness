// Receipt Generation API
// src/app/api/payments/receipt/[transactionId]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { ReceiptGenerator } from '@/lib/services/payment/receipt-generator';
import { verifySessionForApi } from '@/lib/auth/dal';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ transactionId: string }> }
) {
  try {
    // Verify session
    const session = await verifySessionForApi();
    if (!session.isAuth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { transactionId } = await params;

    if (!transactionId) {
      return NextResponse.json({ error: 'Transaction ID required' }, { status: 400 });
    }

    // Generate receipt HTML
    const receiptHTML = await ReceiptGenerator.generateReceipt(transactionId);

    // Return HTML response for receipt
    return new NextResponse(receiptHTML, {
      status: 200,
      headers: {
        'Content-Type': 'text/html',
        'Cache-Control': 'public, max-age=3600' // Cache for 1 hour
      }
    });

  } catch (error) {
    console.error('Receipt generation error:', error);
    
    // Return error HTML instead of JSON for better user experience
    const errorHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Receipt Error</title>
        <style>
          body { 
            font-family: Arial, sans-serif; 
            padding: 40px; 
            text-align: center; 
            background: #f5f5f5; 
          }
          .error-container { 
            background: white; 
            padding: 40px; 
            border-radius: 10px; 
            box-shadow: 0 4px 8px rgba(0,0,0,0.1); 
            max-width: 500px; 
            margin: 0 auto; 
          }
          .error-icon { 
            font-size: 48px; 
            color: #dc3545; 
            margin-bottom: 20px; 
          }
          .error-title { 
            color: #dc3545; 
            font-size: 24px; 
            margin-bottom: 10px; 
          }
          .error-message { 
            color: #666; 
            font-size: 16px; 
          }
        </style>
      </head>
      <body>
        <div class="error-container">
          <div class="error-icon">⚠️</div>
          <h2 class="error-title">Receipt Error</h2>
          <p class="error-message">Unable to generate receipt. Please contact support if the problem persists.</p>
        </div>
      </body>
      </html>
    `;
    
    return new NextResponse(errorHTML, {
      status: 500,
      headers: { 'Content-Type': 'text/html' }
    });
  }
}