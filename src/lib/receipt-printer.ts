/**
 * RECEIPT PRINTER UTILITY
 * 
 * Generates formatted receipts optimized for 80mm thermal printers
 * Used for walk-in registrations and payment receipts
 */

import QRCode from 'qrcode';

interface ReceiptData {
  receiptNumber: string;
  memberName: string;
  memberId: string;
  email: string;
  phone: string;
  password?: string; // Auto-generated password for walk-in registrations
  registrationType: 'SINGLE' | 'COUPLE' | 'FAMILY';
  registrationFee: number;
  membershipPlan: string;
  planPrice: number;
  planDuration: string;
  firstPaymentDate: string;
  paymentMethod: 'CASH' | 'MOMO' | 'CARD';
  momoReference?: string;
  amountPaid?: number;
  qrCode: string;
  receivedBy: string;
  emergencyContact?: string;
  emergencyPhone?: string;
  parqCompleted?: boolean;
  parqRiskLevel?: string;
}

export async function printRegistrationReceipt(data: ReceiptData) {
  const receiptWindow = window.open('', '', 'width=300,height=600');
  
  if (!receiptWindow) {
    alert('Please allow pop-ups to print receipt');
    return;
  }

  let qrDataUrl = '';
  try {
    qrDataUrl = await QRCode.toDataURL(data.qrCode, { margin: 1, width: 160 });
  } catch (error) {
    console.warn('Failed to generate QR image for receipt:', error);
  }

  const receiptHTML = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Registration Receipt - ${data.receiptNumber}</title>
      <style>
        @media print {
          @page {
            size: 80mm auto;
            margin: 0;
          }
          body {
            margin: 0;
            padding: 8mm 4mm;
          }
        }
        
        body {
          font-family: 'Courier New', monospace;
          font-size: 11px;
          line-height: 1.4;
          max-width: 72mm;
          margin: 0 auto;
          padding: 8mm 4mm;
        }
        
        .logo {
          text-align: center;
          margin-bottom: 8px;
        }
        
        .logo img {
          width: 120px;
          height: auto;
        }
        
        .header {
          text-align: center;
          font-weight: bold;
          font-size: 14px;
          margin-bottom: 4px;
          text-transform: uppercase;
          letter-spacing: 1px;
        }
        
        .subheader {
          text-align: center;
          font-size: 10px;
          margin-bottom: 2px;
        }
        
        .divider {
          border-top: 1px dashed #000;
          margin: 8px 0;
        }
        
        .divider-double {
          border-top: 2px solid #000;
          margin: 8px 0;
        }
        
        .section-title {
          font-weight: bold;
          font-size: 11px;
          margin: 6px 0 3px 0;
          text-transform: uppercase;
        }
        
        .row {
          display: flex;
          justify-content: space-between;
          margin: 2px 0;
          font-size: 10px;
        }
        
        .row-label {
          flex: 0 0 45%;
        }
        
        .row-value {
          flex: 0 0 55%;
          text-align: right;
          font-weight: bold;
        }
        
        .amount {
          font-size: 13px;
          font-weight: bold;
        }
        
        .total-row {
          margin: 8px 0;
          padding: 4px 0;
          border-top: 1px solid #000;
          border-bottom: 1px solid #000;
        }
        
        .footer {
          text-align: center;
          font-size: 9px;
          margin-top: 10px;
        }
        
        .qr-section {
          text-align: center;
          margin: 8px 0;
          padding: 6px 0;
          border: 1px dashed #000;
        }
        
        .qr-code {
          font-family: 'Courier New', monospace;
          font-size: 10px;
          font-weight: bold;
          letter-spacing: 1px;
        }
        
        .receipt-no {
          text-align: center;
          font-size: 9px;
          margin: 4px 0;
        }
        
        .timestamp {
          text-align: center;
          font-size: 9px;
          margin: 2px 0;
        }
      </style>
    </head>
    <body>
      <!-- Logo -->
      <div class="logo">
        <img src="/gemfitness.svg" alt="GemFitness" onerror="this.style.display='none'" />
      </div>
      
      <!-- Business Header -->
      <div class="header">GEMFITNESS CENTRE</div>
      <div class="subheader">Accra, Ghana</div>
      <div class="subheader">Tel: 059 893 4010</div>
      <div class="subheader">Email: info@gemfitness.com</div>
      
      <div class="divider-double"></div>
      
      <!-- Receipt Info -->
      <div class="receipt-no">Receipt No: ${data.receiptNumber}</div>
      <div class="timestamp">${new Date().toLocaleString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      })}</div>
      
      <div class="divider"></div>
      
      <!-- Member Information -->
      <div class="section-title">Member Information</div>
      <div class="row">
        <div class="row-label">Name:</div>
        <div class="row-value">${data.memberName}</div>
      </div>
      <div class="row">
        <div class="row-label">Member ID:</div>
        <div class="row-value">${data.memberId}</div>
      </div>
      <div class="row">
        <div class="row-label">Phone:</div>
        <div class="row-value">${data.phone}</div>
      </div>
      <div class="row">
        <div class="row-label">Email:</div>
        <div class="row-value" style="font-size: 9px;">${data.email}</div>
      </div>
      ${data.password ? `
      <div style="background: #f0f0f0; padding: 6px; margin: 8px 0; border: 2px dashed #000;">
        <div style="text-align: center; font-weight: bold; font-size: 10px; margin-bottom: 3px;">LOGIN CREDENTIALS</div>
        <div class="row">
          <div class="row-label">Username:</div>
          <div class="row-value" style="font-size: 9px;">${data.email}</div>
        </div>
        <div class="row">
          <div class="row-label">Password:</div>
          <div class="row-value" style="font-size: 12px; letter-spacing: 1px;">${data.password}</div>
        </div>
        <div style="text-align: center; font-size: 8px; margin-top: 3px;">Please keep this safe!</div>
      </div>
      ` : ''}
      ${data.emergencyContact ? `
      <div class="divider"></div>
      <div class="section-title">Emergency Contact</div>
      <div class="row">
        <div class="row-label">Name:</div>
        <div class="row-value">${data.emergencyContact}</div>
      </div>
      <div class="row">
        <div class="row-label">Phone:</div>
        <div class="row-value">${data.emergencyPhone}</div>
      </div>
      ` : ''}
      
      <div class="divider"></div>
      
      <!-- Registration Details -->
      <div class="section-title">Registration Fee</div>
      <div class="row">
        <div class="row-label">${data.registrationType} Registration</div>
        <div class="row-value amount">GH₵ ${data.registrationFee.toFixed(2)}</div>
      </div>
      
      <div class="divider"></div>
      
      <!-- Membership Plan -->
      <div class="section-title">Membership Plan Selected</div>
      <div class="row">
        <div class="row-label">Plan:</div>
        <div class="row-value">${data.membershipPlan}</div>
      </div>
      <div class="row">
        <div class="row-label">Price:</div>
        <div class="row-value">GH₵ ${data.planPrice.toFixed(2)}</div>
      </div>
      <div class="row">
        <div class="row-label">Duration:</div>
        <div class="row-value">${data.planDuration}</div>
      </div>
      <div class="row">
        <div class="row-label">First Payment:</div>
        <div class="row-value">${data.firstPaymentDate}</div>
      </div>
      
      <div class="divider-double"></div>
      
      <!-- Payment Information -->
      <div class="section-title">Payment Details</div>
      <div class="row total-row">
        <div class="row-label">TOTAL PAID:</div>
        <div class="row-value amount">GH₵ ${Number(data.amountPaid ?? data.registrationFee ?? 0).toFixed(2)}</div>
      </div>
      <div class="row">
        <div class="row-label">Method:</div>
        <div class="row-value">${data.paymentMethod}</div>
      </div>
      ${data.momoReference ? `
      <div class="row">
        <div class="row-label">MoMo Ref:</div>
        <div class="row-value" style="font-size: 9px;">${data.momoReference}</div>
      </div>
      ` : ''}
      <div class="row">
        <div class="row-label">Status:</div>
        <div class="row-value">PAID</div>
      </div>
      <div class="row">
        <div class="row-label">Received By:</div>
        <div class="row-value" style="font-size: 9px;">${data.receivedBy}</div>
      </div>
      
      <div class="divider"></div>
      
      ${data.parqCompleted ? `
      <!-- Health Screening Status -->
      <div style="background: #e8f5e9; padding: 6px; margin: 8px 0; border-left: 3px solid #4caf50;">
        <div style="font-size: 10px; font-weight: bold; margin-bottom: 2px;">✓ Health Screening Complete</div>
        <div style="font-size: 9px;">Risk Level: ${data.parqRiskLevel || 'LOW'}</div>
      </div>
      
      <div class="divider"></div>
      ` : ''}
      
      <!-- QR Code Section -->
      <div class="qr-section">
        <div style="font-size: 9px; margin-bottom: 4px;">MEMBER QR CODE</div>
        ${qrDataUrl ? `<img src="${qrDataUrl}" alt="Member QR" style="width: 120px; height: 120px;" />` : ''}
        <div class="qr-code">${data.qrCode}</div>
        <div style="font-size: 8px; margin-top: 4px;">Scan for check-in</div>
      </div>
      
      <div class="divider"></div>
      
      <!-- Footer -->
      <div class="footer">
        <div style="font-weight: bold; margin-bottom: 4px;">THANK YOU FOR JOINING!</div>
        <div>Your fitness journey starts here</div>
        <div style="margin-top: 6px;">Visit: www.gemfitness.com</div>
        <div>WhatsApp: 059 893 4010</div>
        <div style="margin-top: 6px; font-size: 8px;">This is an official receipt</div>
        <div style="font-size: 8px;">Keep for your records</div>
      </div>
      
      <div style="height: 20mm;"></div>
      <script>
        window.onload = function () {
          const imgs = Array.from(document.images);
          let loaded = 0;
          const done = () => {
            setTimeout(() => {
              window.print();
              window.onafterprint = () => window.close();
            }, 300);
          };
          if (imgs.length === 0) {
            done();
            return;
          }
          imgs.forEach((img) => {
            if (img.complete) {
              loaded += 1;
              if (loaded === imgs.length) done();
            } else {
              img.onload = img.onerror = () => {
                loaded += 1;
                if (loaded === imgs.length) done();
              };
            }
          });
        };
      </script>
    </body>
    </html>
  `;

  receiptWindow.document.write(receiptHTML);
  receiptWindow.document.close();
}

// Generate receipt number
export function generateReceiptNumber(): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const time = Date.now().toString().slice(-4);
  return `REG-${year}${month}${day}-${time}`;
}

// Print payment receipt (for recurring payments)
export function printPaymentReceipt(data: {
  receiptNumber: string;
  memberName: string;
  memberId: string;
  planName: string;
  amount: number;
  paymentMethod: string;
  reference?: string;
  receivedBy: string;
}) {
  const receiptWindow = window.open('', '', 'width=300,height=600');
  
  if (!receiptWindow) {
    alert('Please allow pop-ups to print receipt');
    return;
  }

  const receiptHTML = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Payment Receipt - ${data.receiptNumber}</title>
      <style>
        @media print {
          @page {
            size: 80mm auto;
            margin: 0;
          }
          body {
            margin: 0;
            padding: 8mm 4mm;
          }
        }
        
        body {
          font-family: 'Courier New', monospace;
          font-size: 11px;
          line-height: 1.4;
          max-width: 72mm;
          margin: 0 auto;
          padding: 8mm 4mm;
        }
        
        .logo {
          text-align: center;
          margin-bottom: 8px;
        }
        
        .logo img {
          width: 120px;
          height: auto;
        }
        
        .header {
          text-align: center;
          font-weight: bold;
          font-size: 14px;
          margin-bottom: 4px;
          text-transform: uppercase;
          letter-spacing: 1px;
        }
        
        .subheader {
          text-align: center;
          font-size: 10px;
          margin-bottom: 2px;
        }
        
        .divider {
          border-top: 1px dashed #000;
          margin: 8px 0;
        }
        
        .divider-double {
          border-top: 2px solid #000;
          margin: 8px 0;
        }
        
        .section-title {
          font-weight: bold;
          font-size: 11px;
          margin: 6px 0 3px 0;
          text-transform: uppercase;
        }
        
        .row {
          display: flex;
          justify-content: space-between;
          margin: 2px 0;
          font-size: 10px;
        }
        
        .row-label {
          flex: 0 0 45%;
        }
        
        .row-value {
          flex: 0 0 55%;
          text-align: right;
          font-weight: bold;
        }
        
        .amount {
          font-size: 13px;
          font-weight: bold;
        }
        
        .total-row {
          margin: 8px 0;
          padding: 4px 0;
          border-top: 1px solid #000;
          border-bottom: 1px solid #000;
        }
        
        .footer {
          text-align: center;
          font-size: 9px;
          margin-top: 10px;
        }
        
        .receipt-no {
          text-align: center;
          font-size: 9px;
          margin: 4px 0;
        }
        
        .timestamp {
          text-align: center;
          font-size: 9px;
          margin: 2px 0;
        }
      </style>
    </head>
    <body>
      <div class="logo">
        <img src="/images/logo.png" alt="GemFitness" onerror="this.style.display='none'" />
      </div>
      
      <div class="header">GEMFITNESS CENTRE</div>
      <div class="subheader">Payment Receipt</div>
      <div class="subheader">Tel: 059 893 4010</div>
      
      <div class="divider-double"></div>
      
      <div class="receipt-no">Receipt No: ${data.receiptNumber}</div>
      <div class="timestamp">${new Date().toLocaleString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      })}</div>
      
      <div class="divider"></div>
      
      <div class="section-title">Member Details</div>
      <div class="row">
        <div class="row-label">Name:</div>
        <div class="row-value">${data.memberName}</div>
      </div>
      <div class="row">
        <div class="row-label">Member ID:</div>
        <div class="row-value">${data.memberId}</div>
      </div>
      
      <div class="divider"></div>
      
      <div class="section-title">Payment Information</div>
      <div class="row">
        <div class="row-label">Plan:</div>
        <div class="row-value">${data.planName}</div>
      </div>
      <div class="row total-row">
        <div class="row-label">AMOUNT PAID:</div>
        <div class="row-value amount">GH₵ ${data.amount.toFixed(2)}</div>
      </div>
      <div class="row">
        <div class="row-label">Method:</div>
        <div class="row-value">${data.paymentMethod}</div>
      </div>
      ${data.reference ? `
      <div class="row">
        <div class="row-label">Reference:</div>
        <div class="row-value" style="font-size: 8px;">${data.reference}</div>
      </div>
      ` : ''}
      <div class="row">
        <div class="row-label">Received By:</div>
        <div class="row-value" style="font-size: 9px;">${data.receivedBy}</div>
      </div>
      
      <div class="divider-double"></div>
      
      <div class="footer">
        <div style="font-weight: bold; margin-bottom: 4px;">THANK YOU!</div>
        <div style="margin-top: 6px;">Questions? Call 059 893 4010</div>
        <div style="margin-top: 6px; font-size: 8px;">Official Receipt - Keep for Records</div>
      </div>
      
      <div style="height: 20mm;"></div>
    </body>
    </html>
  `;

  receiptWindow.document.write(receiptHTML);
  receiptWindow.document.close();
  
  receiptWindow.onload = () => {
    setTimeout(() => {
      receiptWindow.print();
      receiptWindow.onafterprint = () => {
        receiptWindow.close();
      };
    }, 500);
  };
}
