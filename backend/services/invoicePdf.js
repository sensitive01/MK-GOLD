const fs = require('fs');
const path = require('path');
const os = require('os');
const { execFile } = require('child_process');
const axios = require('axios');
const PDFDocument = require('pdfkit');
const { cloudinary } = require('../config/cloudinary');

/**
 * Locate Chrome or Edge executable on Windows/Linux/Mac
 */
function getBrowserExecutablePath() {
  const candidates = [
    '/usr/bin/google-chrome',
    '/usr/bin/google-chrome-stable',
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser',
    '/snap/bin/chromium',
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
  ];
  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) return candidate;
  }
  return null;
}

/**
 * Safely fetches an image and converts to a Base64 data URL
 * @param {string} urlOrPath 
 * @returns {Promise<string>}
 */
async function toBase64DataUrl(urlOrPath) {
  if (!urlOrPath || typeof urlOrPath !== 'string') return '';
  try {
    if (urlOrPath.startsWith('http://') || urlOrPath.startsWith('https://')) {
      const res = await axios.get(urlOrPath, { responseType: 'arraybuffer', timeout: 8000 });
      const contentType = res.headers['content-type'] || 'image/jpeg';
      return `data:${contentType};base64,${Buffer.from(res.data).toString('base64')}`;
    }
    if (path.isAbsolute(urlOrPath) && fs.existsSync(urlOrPath)) {
      const ext = path.extname(urlOrPath).toLowerCase();
      const mime = ext === '.png' ? 'image/png' : ext === '.svg' ? 'image/svg+xml' : 'image/jpeg';
      return `data:${mime};base64,${fs.readFileSync(urlOrPath).toString('base64')}`;
    }
    const cleanPath = urlOrPath.startsWith('/') ? urlOrPath.slice(1) : urlOrPath;
    let localPath = path.join(__dirname, '..', cleanPath);
    if (!fs.existsSync(localPath)) {
      localPath = path.join(__dirname, '../public', cleanPath);
    }
    if (!fs.existsSync(localPath)) {
      localPath = path.join(__dirname, '../../frontend/public', cleanPath);
    }
    if (fs.existsSync(localPath)) {
      const ext = path.extname(localPath).toLowerCase();
      const mime = ext === '.png' ? 'image/png' : ext === '.svg' ? 'image/svg+xml' : 'image/jpeg';
      return `data:${mime};base64,${fs.readFileSync(localPath).toString('base64')}`;
    }
  } catch (e) {
    // Return empty if image cannot be fetched
  }
  return '';
}

function maskPhoneNumber(phone) {
  if (!phone) return '';
  const str = phone.toString();
  if (str.length <= 4) return str;
  return `${str.slice(0, 2)}******${str.slice(-2)}`;
}

/**
 * Generates exact HTML invoice matching the frontend SalePrint.js template
 * @param {Object} data - Sale document
 * @returns {Promise<string>}
 */
async function generateExactInvoiceHtml(data) {
  // 1. Collect ornament photos
  const ornamentPhotos = [];
  if (data?.assigneeProof) {
    ornamentPhotos.push(data.assigneeProof);
  }
  if (data?.release && data.release.length > 0) {
    data.release.forEach((rel) => {
      if (rel.proofDocuments && rel.proofDocuments.length > 0) {
        rel.proofDocuments.forEach((doc) => {
          if (doc.documentFile) {
            if (doc.documentType === 'Ornaments Photo' || rel.proofDocuments.length === 1) {
              ornamentPhotos.push(doc.documentFile);
            }
          }
        });
      }
    });
  }
  if (data?.proof && data.proof.length > 0) {
    data.proof.forEach((p) => {
      if (p.uploadedFile && p.documentType?.toLowerCase() === 'ornaments photo') {
        ornamentPhotos.push(p.uploadedFile);
      }
    });
  }
  if (data?.ornaments && data.ornaments.length > 0) {
    data.ornaments.forEach((orn) => {
      if (orn.ornamentPhoto) {
        ornamentPhotos.push(orn.ornamentPhoto);
      }
    });
  }
  const uniqueOrnamentPhotos = Array.from(new Set(ornamentPhotos));

  // 2. Table rows
  const tableRows = [];
  if (data?.ornaments && data.ornaments.length > 0) {
    data.ornaments.forEach((orn) => {
      tableRows.push({
        name: orn.ornamentType || 'Ornament',
        grossWeight: Number(orn.grossWeight) || 0,
        stoneWeight: Number(orn.stoneWeight) || 0,
        netWeight: Number(orn.netWeight) || 0,
        purity: Number(orn.purity) || 0,
        value: Number(orn.netAmount) || 0,
      });
    });
  } else if (data?.release && data.release.length > 0) {
    data.release.forEach((rel) => {
      if (rel.ornaments && rel.ornaments.length > 0) {
        rel.ornaments.forEach((relOrn) => {
          tableRows.push({
            name: `${relOrn.ornamentType} (Release)`,
            grossWeight: Number(relOrn.grossWeight) || 0,
            stoneWeight: 0,
            netWeight: Number(relOrn.netWeight) || 0,
            purity: Number(relOrn.purity) || 0,
            value: 0,
          });
        });
      } else {
        tableRows.push({
          name: `Release Pledge (${rel.pledgeId} - ${rel.pledgedIn})`,
          grossWeight: Number(rel.weight) || 0,
          stoneWeight: 0,
          netWeight: Number(rel.weight) || 0,
          purity: 0,
          value: Number(rel.payableAmount) || 0,
        });
      }
    });
  }

  const totalGrossWeight = tableRows.reduce((sum, row) => sum + row.grossWeight, 0);
  const totalStoneWeight = tableRows.reduce((sum, row) => sum + row.stoneWeight, 0);
  const totalNetWeight = tableRows.reduce((sum, row) => sum + row.netWeight, 0);
  const totalValue = tableRows.reduce((sum, row) => sum + row.value, 0);
  const totalFineWeight = tableRows.reduce((sum, row) => sum + ((Number(row.netWeight) || 0) * (Number(row.purity) || 0) / 100), 0);
  const averagePurity = totalNetWeight > 0 ? (totalFineWeight / totalNetWeight) * 100 : 0;

  // 3. Valuation summary calculations
  const netAmount = Number(data?.netAmount) || 0;
  const marginPercent = Number(data?.margin) || 0;
  const marginAmount = Math.round((netAmount * marginPercent) / 100);

  let cgstAmount = 0;
  let sgstAmount = 0;
  let serviceChargesAmount = 0;

  if (marginPercent >= 3) {
    cgstAmount = Math.round(netAmount * 0.015);
    sgstAmount = Math.round(netAmount * 0.015);
    serviceChargesAmount = Math.max(0, marginAmount - cgstAmount - sgstAmount);
  } else {
    cgstAmount = Math.round(marginAmount * 0.25);
    sgstAmount = Math.round(marginAmount * 0.25);
    serviceChargesAmount = Math.max(0, marginAmount - cgstAmount - sgstAmount);
  }

  const cgstPercent = marginPercent >= 3 ? 1.5 : (marginPercent * 0.25).toFixed(2);
  const sgstPercent = marginPercent >= 3 ? 1.5 : (marginPercent * 0.25).toFixed(2);
  const serviceChargesPercent = marginPercent >= 3 ? (marginPercent - 3) : (marginPercent * 0.5).toFixed(2);
  const releaseChargesAmount = Math.round(data?.release?.reduce((prev, cur) => prev + (cur?.payableAmount || 0), 0) || 0);

  // 4. Preload images as Base64 Data URLs
  const logoPath = path.join(__dirname, '../assets/logo.png');
  const logoBase64 = await toBase64DataUrl(logoPath);
  const customerPhotoBase64 = await toBase64DataUrl(data?.customer?.profileImage?.uploadedFile);
  const signatureBase64 = await toBase64DataUrl(data?.customer?.signatureImage?.uploadedFile);

  const ornamentPhotosBase64 = [];
  for (const photo of uniqueOrnamentPhotos) {
    const b64 = await toBase64DataUrl(photo);
    if (b64) ornamentPhotosBase64.push(b64);
  }

  const address = data?.customer?.address?.length > 0
    ? `${data.customer.address[0]?.address || ''}, ${data.customer.address[0]?.city || ''}, ${data.customer.address[0]?.state || ''}, ${data.customer.address[0]?.pincode || ''}`
    : '';

  const idNo = data?.customer?.idNo ? `${data?.customer?.chooseId || 'ID'}: ${data?.customer?.idNo}` : '';

  const formattedDate = data?.createdAt
    ? new Date(data.createdAt).toISOString().replace('T', ' ').substring(0, 19)
    : '';

  const rateText = data?.purchaseType?.toLowerCase() === 'gold'
    ? `24karat Gold Rate per Gram: ₹ ${Number(data?.goldRate || 0).toLocaleString('en-IN')}`
    : `Silver Rate per Gram: ₹ ${Number(data?.silverRate || 0).toLocaleString('en-IN')}`;

  const rowsHtml = tableRows.map((row, index) => `
    <tr>
      <td style="border: 1px solid #000; padding: 6px; text-align: center;">${index + 1}</td>
      <td style="border: 1px solid #000; padding: 6px; text-align: left;">${row.name}</td>
      <td style="border: 1px solid #000; padding: 6px; text-align: center;">${row.grossWeight.toFixed(2)}</td>
      <td style="border: 1px solid #000; padding: 6px; text-align: center;">${row.stoneWeight.toFixed(2)}</td>
      <td style="border: 1px solid #000; padding: 6px; text-align: center;">${row.netWeight.toFixed(2)}</td>
      <td style="border: 1px solid #000; padding: 6px; text-align: center;">${row.purity}%</td>
      <td style="border: 1px solid #000; padding: 6px; text-align: right;">${Math.round(row.value).toLocaleString('en-IN')}</td>
    </tr>
  `).join('');

  let ornamentPhotosHtml = '';
  if (ornamentPhotosBase64.length > 0) {
    ornamentPhotosHtml = ornamentPhotosBase64.map((b64, idx) => {
      let imgWidth = '100%';
      let imgHeight = '100%';
      if (ornamentPhotosBase64.length === 2) {
        imgWidth = '48%';
      } else if (ornamentPhotosBase64.length >= 3) {
        imgWidth = '48%';
        imgHeight = '48%';
      }
      return `<img key="${idx}" src="${b64}" alt="Ornament ${idx + 1}" style="width: ${imgWidth}; height: ${imgHeight}; object-fit: contain; border: 1px solid #ddd; background-color: #fff;" />`;
    }).join('');
  } else {
    ornamentPhotosHtml = '<div style="display: flex; align-items: center; justify-content: center; height: 100%; width: 100%;"><span style="font-size: 11px; color: #999;">No Ornament Photo</span></div>';
  }

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Print Bill</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 8mm 10mm;
    }
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    body {
      margin: 0;
      padding: 0;
      background-color: #fff;
      font-family: Arial, sans-serif;
      color: #000;
    }
    #pdf {
      color: #000;
      background-color: #fff;
      padding: 0;
      font-family: Arial, sans-serif;
      font-size: 13px;
      width: 100%;
      max-width: 750px;
      margin: 0 auto;
      box-sizing: border-box;
    }
  </style>
</head>
<body style="margin:0;">
  <div id="pdf" style="color: #000; background-color: #fff; padding: 10px 0; font-family: Arial, sans-serif; font-size: 13px; width: 750px; margin: 0 auto; box-sizing: border-box;">

    <!-- Header Section -->
    <table style="width: 100%; border-collapse: collapse; margin-bottom: 16px;">
      <tbody>
        <tr>
          <td style="vertical-align: top; padding-bottom: 8px;">
            <h2 style="margin: 0; font-size: 22px; font-weight: bold;">PURCHASE INVOICE</h2>
          </td>
          <td style="text-align: right; vertical-align: top; padding-bottom: 8px;">
            ${logoBase64 ? `<img alt="Logo" src="${logoBase64}" style="width: 90px; height: auto; object-fit: contain;" />` : ''}
          </td>
        </tr>
        <tr>
          <td style="vertical-align: top; width: 60%; padding-top: 6px;">
            <h3 style="margin: 0; font-size: 16px; font-weight: bold;">
              MK Gold | ${data?.branch?.branchName || ''}
            </h3>
            <p style="margin: 4px 0 0 0; font-size: 12px; color: #333;">
              <strong>Address:</strong> ${data?.branch?.address?.address || data?.branch?.address?.city || ''}
            </p>
            <p style="margin: 4px 0 0 0; font-size: 12px; color: #333;">
              <strong>Phone:</strong> 63661 11999 &nbsp;&nbsp;&nbsp;&nbsp; <strong>GST:</strong> ${data?.branch?.gstNumber || ''}
            </p>
          </td>
          <td style="text-align: right; vertical-align: top; width: 40%; padding-top: 6px;">
            <p style="margin: 0; font-size: 12px;">
              <strong>Invoice No.:</strong> ${data?.billId || ''}
            </p>
            <p style="margin: 4px 0 0 0; font-size: 12px;">
              <strong>Date & Time:</strong> ${formattedDate}
            </p>
          </td>
        </tr>
      </tbody>
    </table>

    <!-- Customer Details & Customer Photo Section -->
    <table style="width: 100%; border-collapse: collapse; margin-bottom: 16px;">
      <thead>
        <tr>
          <th style="text-align: left; font-size: 14px; padding-bottom: 6px; width: 72%;">Customer Details</th>
          <th style="text-align: left; font-size: 14px; padding-bottom: 6px; width: 28%; padding-left: 15px;">Customer Photo</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td style="vertical-align: top;">
            <table style="width: 100%; border-collapse: collapse; border: 1px solid #000;">
              <tbody>
                <tr>
                  <td style="border: 1px solid #000; padding: 6px 8px; font-weight: bold; width: 30%; background-color: #f9f9f9;">Customer Name</td>
                  <td style="border: 1px solid #000; padding: 6px 8px;">${data?.customer?.name || ''}</td>
                </tr>
                <tr>
                  <td style="border: 1px solid #000; padding: 6px 8px; font-weight: bold; background-color: #f9f9f9;">Mobile Number</td>
                  <td style="border: 1px solid #000; padding: 6px 8px;">${maskPhoneNumber(data?.customer?.phoneNumber)}</td>
                </tr>
                <tr>
                  <td style="border: 1px solid #000; padding: 6px 8px; font-weight: bold; background-color: #f9f9f9;">Address</td>
                  <td style="border: 1px solid #000; padding: 6px 8px;">${address}</td>
                </tr>
                <tr>
                  <td style="border: 1px solid #000; padding: 6px 8px; font-weight: bold; background-color: #f9f9f9;">ID Proof Number</td>
                  <td style="border: 1px solid #000; padding: 6px 8px;">${idNo}</td>
                </tr>
              </tbody>
            </table>
          </td>
          <td style="vertical-align: top; padding-left: 15px;">
            <div style="width: 100%; height: 116px; border: 1px solid #000; display: flex; align-items: center; justify-content: center; background-color: #fafafa; overflow: hidden;">
              ${customerPhotoBase64 ? `<img src="${customerPhotoBase64}" alt="Customer" style="width: 100%; height: 100%; object-fit: contain;" />` : '<span style="font-size: 11px; color: #999;">No Photo</span>'}
            </div>
          </td>
        </tr>
      </tbody>
    </table>

    <!-- Ornament Details Section Header -->
    <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 6px;">
      <span style="font-size: 14px; font-weight: bold;">Ornament Details</span>
      <span style="font-size: 12px; font-weight: bold;">${rateText}</span>
    </div>

    <!-- Ornament Table -->
    <table style="width: 100%; border-collapse: collapse; border: 1px solid #000; margin-bottom: 16px;">
      <thead>
        <tr style="background-color: #FFD700;">
          <th style="border: 1px solid #000; padding: 6px; color: #000; font-weight: bold; width: 6%; text-align: center;">Sno</th>
          <th style="border: 1px solid #000; padding: 6px; color: #000; font-weight: bold; width: 38%; text-align: left;">Ornament(s)</th>
          <th style="border: 1px solid #000; padding: 6px; color: #000; font-weight: bold; width: 11%; text-align: center;">Gross Wt</th>
          <th style="border: 1px solid #000; padding: 6px; color: #000; font-weight: bold; width: 12%; text-align: center;">Stone / Wastage</th>
          <th style="border: 1px solid #000; padding: 6px; color: #000; font-weight: bold; width: 11%; text-align: center;">Net Wt</th>
          <th style="border: 1px solid #000; padding: 6px; color: #000; font-weight: bold; width: 11%; text-align: center;">Purity (%)</th>
          <th style="border: 1px solid #000; padding: 6px; color: #000; font-weight: bold; width: 11%; text-align: right;">Value (₹)</th>
        </tr>
      </thead>
      <tbody>
        ${rowsHtml}
        <!-- Grand Total Row -->
        <tr style="font-weight: bold; background-color: #f9f9f9;">
          <td colspan="2" style="border: 1px solid #000; padding: 6px; text-align: right;">Grand Total =</td>
          <td style="border: 1px solid #000; padding: 6px; text-align: center;">${totalGrossWeight.toFixed(2)}</td>
          <td style="border: 1px solid #000; padding: 6px; text-align: center;">${totalStoneWeight.toFixed(2)}</td>
          <td style="border: 1px solid #000; padding: 6px; text-align: center;">${totalNetWeight.toFixed(2)}</td>
          <td style="border: 1px solid #000; padding: 6px; text-align: center;">${averagePurity > 0 ? `${averagePurity.toFixed(2)}%` : '-'}</td>
          <td style="border: 1px solid #000; padding: 6px; text-align: right;">${Math.round(totalValue).toLocaleString('en-IN')}</td>
        </tr>
      </tbody>
    </table>

    <!-- Ornament Photo & Valuation Summary Section -->
    <table style="width: 100%; border-collapse: collapse; margin-bottom: 16px;">
      <thead>
        <tr>
          <th style="text-align: left; font-size: 14px; padding-bottom: 6px; width: 40%;">Ornament Photo</th>
          <th style="text-align: left; font-size: 14px; padding-bottom: 6px; width: 60%; padding-left: 15px;">Valuation Summary</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td style="vertical-align: top;">
            <div style="width: 100%; height: 185px; border: 1px solid #000; display: flex; flex-wrap: wrap; align-content: center; justify-content: center; background-color: #fafafa; overflow: hidden; padding: 4px; box-sizing: border-box; gap: 4px;">
              ${ornamentPhotosHtml}
            </div>
          </td>
          <td style="vertical-align: top; padding-left: 15px;">
            <table style="width: 100%; border-collapse: collapse; border: 1px solid #000;">
              <tbody>
                <tr>
                  <td style="border: 1px solid #000; padding: 4px 6px; font-size: 11px; color: #444; vertical-align: middle; width: 65%;">
                    (Service Charges are typically charges against Appraiser Charges, Payment Handling Charges, Release Handling Charges, Melting Charges, etc.)
                    <strong style="display: block; color: #000; font-size: 12px; margin-top: 2px;">Service Charges (${serviceChargesPercent}%) =</strong>
                  </td>
                  <td style="border: 1px solid #000; padding: 4px 6px; text-align: right; font-weight: bold; font-size: 13px; vertical-align: bottom; width: 35%;">
                    &#8377; ${serviceChargesAmount.toLocaleString('en-IN')}
                  </td>
                </tr>
                <tr>
                  <td style="border: 1px solid #000; padding: 6px; font-weight: bold; font-size: 12px;">CGST (${cgstPercent}%) =</td>
                  <td style="border: 1px solid #000; padding: 6px; text-align: right; font-weight: bold; font-size: 13px;">
                    &#8377; ${cgstAmount.toLocaleString('en-IN')}
                  </td>
                </tr>
                <tr>
                  <td style="border: 1px solid #000; padding: 6px; font-weight: bold; font-size: 12px;">SGST (${sgstPercent}%) =</td>
                  <td style="border: 1px solid #000; padding: 6px; text-align: right; font-weight: bold; font-size: 13px;">
                    &#8377; ${sgstAmount.toLocaleString('en-IN')}
                  </td>
                </tr>
                ${data?.saleType === 'pledged' ? `
                  <tr>
                    <td style="border: 1px solid #000; padding: 6px; font-weight: bold; font-size: 12px;">Release Charges =</td>
                    <td style="border: 1px solid #000; padding: 6px; text-align: right; font-weight: bold; font-size: 13px;">
                      &#8377; ${releaseChargesAmount.toLocaleString('en-IN')}
                    </td>
                  </tr>
                ` : ''}
                <tr style="background-color: #FFD700;">
                  <td style="border: 1px solid #000; padding: 8px 6px; font-weight: bold; font-size: 13px;">Payable Amount =</td>
                  <td style="border: 1px solid #000; padding: 8px 6px; text-align: right; font-weight: bold; font-size: 15px;">
                    &#8377; ${Math.abs(Math.round(data?.payableAmount || 0)).toLocaleString('en-IN')}
                  </td>
                </tr>
              </tbody>
            </table>
          </td>
        </tr>
      </tbody>
    </table>

    <!-- Terms & Conditions Section -->
    <div style="border: 1px solid #000; padding: 8px; margin-bottom: 16px; box-sizing: border-box;">
      <strong style="display: block; font-size: 12px; margin-bottom: 4px;">Terms & Conditions:</strong>
      <ol style="margin: 0; padding-left: 18px; font-size: 10px; line-height: 1.3; color: #333;">
        <li>All gold/silver purchase transactions are final and binding.</li>
        <li>The valuation is calculated based on current market rates and gold/silver purity assessment.</li>
        <li>In case of release pledged transactions, bank release receipt must be provided for verification.</li>
        <li>Payment will be processed via approved banking channels or cash as per limits.</li>
      </ol>
    </div>

    <!-- Customer Declaration Section -->
    <div style="margin-bottom: 24px;">
      <strong style="display: block; font-size: 12px; margin-bottom: 4px;">Customer Declaration</strong>
      <p style="margin: 0; font-size: 11px; line-height: 1.4; text-align: justify; color: #333;">
        I hereby declare that the ornaments sold by me are my lawful property and are free from any legal dispute, theft, pledge, or encumbrance. I voluntarily agree to sell the above-mentioned ornaments to MK Gold.
      </p>
    </div>

    <!-- Signatures Section -->
    <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
      <tbody>
        <tr>
          <td style="width: 30%; text-align: center; vertical-align: bottom;">
            <div style="height: 50px; display: flex; align-items: center; justify-content: center; margin-bottom: 4px;">
              ${signatureBase64
                ? `<img src="${signatureBase64}" alt="Customer Signature" style="max-height: 50px; max-width: 160px; object-fit: contain;" />`
                : '<div style="border-bottom: 1px solid #000; width: 80%; height: 100%;"></div>'}
            </div>
            <span style="font-size: 11px; font-weight: bold; display: block; border-top: ${signatureBase64 ? '1px solid #000' : 'none'}; width: 80%; margin: 0 auto; padding-top: 4px;">
              Customer Signature
            </span>
          </td>
          <td style="width: 40%; text-align: center; font-size: 11px; color: #555; vertical-align: bottom; padding-bottom: 4px;">
            Thanks For your billing
            <br />
            <a href="https://mkgold.in" target="_blank" rel="noopener noreferrer" style="color: #000; text-decoration: none; font-weight: bold;">mkgold.in</a>
          </td>
          <td style="width: 30%; text-align: center; vertical-align: bottom;">
            <div style="height: 50px; margin-bottom: 4px; display: flex; flex-direction: column; justify-content: flex-end;">
              ${data?.actionBy?.name ? `
                <span style="font-size: 11px; font-style: italic;">${data.actionBy.name}</span>
                <span style="font-size: 9px; color: #666;">(${data?.actionBy?.employeeId || ''})</span>
              ` : '<div style="border-bottom: 1px solid #000; width: 80%; height: 100%;"></div>'}
            </div>
            <span style="font-size: 11px; font-weight: bold; display: block; border-top: 1px solid #000; width: 80%; margin: 0 auto; padding-top: 4px;">
              Authorized Signatory
            </span>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</body>
</html>`;
}

/**
 * Converts HTML to PDF Buffer via Headless Chrome
 * @param {string} html 
 * @returns {Promise<Buffer>}
 */
async function printHtmlToPdf(html) {
  const browserPath = getBrowserExecutablePath();
  if (!browserPath) {
    throw new Error('No compatible browser found for headless PDF generation.');
  }

  const tempId = `inv_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  const tempHtml = path.join(os.tmpdir(), `${tempId}.html`);
  const tempPdf = path.join(os.tmpdir(), `${tempId}.pdf`);

  fs.writeFileSync(tempHtml, html, 'utf8');

  return new Promise((resolve, reject) => {
    const args = [
      '--headless',
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--no-pdf-header-footer',
      '--run-all-compositor-stages-before-draw',
      `--print-to-pdf=${tempPdf}`,
      tempHtml
    ];

    execFile(browserPath, args, { timeout: 25000 }, (error) => {
      try {
        if (fs.existsSync(tempHtml)) fs.unlinkSync(tempHtml);
      } catch (e) {}

      if (error && !fs.existsSync(tempPdf)) {
        return reject(error);
      }

      try {
        if (fs.existsSync(tempPdf)) {
          const pdfBuffer = fs.readFileSync(tempPdf);
          try {
            fs.unlinkSync(tempPdf);
          } catch (e) {}
          return resolve(pdfBuffer);
        }
        reject(new Error('PDF file was not created by browser'));
      } catch (readErr) {
        reject(readErr);
      }
    });
  });
}

/**
 * Generates official MK Gold Purchase Invoice PDF matching the SalePrint UI layout exactly
 * Uses Headless Chrome for 100% exact replicate of the printed bill
 * @param {Object} sale - Fully populated sale document
 * @returns {Promise<Buffer>}
 */
async function createInvoicePdfBuffer(sale) {
  try {
    const html = await generateExactInvoiceHtml(sale);
    const pdfBuffer = await printHtmlToPdf(html);
    return pdfBuffer;
  } catch (err) {
    console.error('[invoicePdf] Headless browser print error, falling back to PDFKit:', err.message);
    return createPdfKitFallbackBuffer(sale);
  }
}

/**
 * Fallback PDFKit generator if headless browser is unavailable
 */
async function createPdfKitFallbackBuffer(sale) {
  const branch = sale.branch || {};
  const customer = sale.customer || {};
  const ornaments = sale.ornaments || [];
  const releases = sale.release || [];

  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 30, size: 'A4' });
      const buffers = [];

      doc.on('data', b => buffers.push(b));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', reject);

      const margin = 30;
      const contentWidth = 595.28 - (margin * 2);

      doc.fillColor('#000000').fontSize(18).font('Helvetica-Bold').text('PURCHASE INVOICE', margin, 30);
      doc.fontSize(12).text(`MK Gold | ${branch.branchName || ''}`, margin, 58);
      doc.fontSize(9).font('Helvetica').text(`Invoice No.: ${sale.billId || ''}`, margin, 74);
      doc.text(`Payable Amount: ₹ ${Math.abs(Math.round(sale.payableAmount || 0)).toLocaleString('en-IN')}`, margin, 88);

      doc.end();
    } catch (e) {
      reject(e);
    }
  });
}

/**
 * Creates the invoice PDF matching SalePrint UI, saves a local copy, uploads to Cloudinary, and returns URL
 * @param {Object} sale - Fully populated sale document
 * @returns {Promise<{pdfUrl: string, filename: string}>}
 */
async function generateAndUploadInvoice(sale) {
  const billId = sale.billId || sale._id.toString();
  const filename = `MKGold_Invoice_${billId}.pdf`;

  const pdfBuffer = await createInvoicePdfBuffer(sale);

  // 1. Save local copy in public/invoices for fallback
  try {
    const publicInvoicesDir = path.join(__dirname, '../public/invoices');
    if (!fs.existsSync(publicInvoicesDir)) {
      fs.mkdirSync(publicInvoicesDir, { recursive: true });
    }
    fs.writeFileSync(path.join(publicInvoicesDir, filename), pdfBuffer);
  } catch (localErr) {
    console.warn('Failed to save local invoice copy:', localErr.message);
  }

  // 2. Upload to Cloudinary to obtain a public HTTPS link
  const pdfUrl = await new Promise((resolve) => {
    try {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          resource_type: 'raw',
          folder: 'mk_gold_invoices',
          public_id: filename,
          overwrite: true,
        },
        (error, result) => {
          if (error || !result?.secure_url) {
            console.warn('Cloudinary upload warning, falling back to local URL:', error?.message || 'No URL');
            const baseUrl = process.env.PUBLIC_APP_URL || 'https://mkgold.tech';
            return resolve(`${baseUrl}/invoices/${filename}`);
          }
          console.log('Invoice PDF uploaded to Cloudinary:', result.secure_url);
          resolve(result.secure_url);
        }
      );
      uploadStream.end(pdfBuffer);
    } catch (uploadEx) {
      console.warn('Cloudinary upload exception:', uploadEx.message);
      const baseUrl = process.env.PUBLIC_APP_URL || 'https://mkgold.tech';
      resolve(`${baseUrl}/invoices/${filename}`);
    }
  });

  return { pdfUrl, filename };
}

/**
 * For release transactions, generates the matching invoice PDF and uploads to Cloudinary
 * @param {Object} sale - Fully populated sale document
 * @returns {Promise<{pdfUrl: string, filename: string}>}
 */
async function generateAndUploadReleaseInvoice(sale) {
  const billId = sale.billId || sale._id.toString();
  const filename = `MKGold_Release_Invoice_${billId}.pdf`;

  const pdfBuffer = await createInvoicePdfBuffer(sale);

  try {
    const publicInvoicesDir = path.join(__dirname, '../public/invoices');
    if (!fs.existsSync(publicInvoicesDir)) {
      fs.mkdirSync(publicInvoicesDir, { recursive: true });
    }
    fs.writeFileSync(path.join(publicInvoicesDir, filename), pdfBuffer);
  } catch (localErr) {
    console.warn('Failed to save local release invoice copy:', localErr.message);
  }

  const pdfUrl = await new Promise((resolve) => {
    try {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          resource_type: 'raw',
          folder: 'mk_gold_invoices',
          public_id: filename,
          overwrite: true,
        },
        (error, result) => {
          if (error || !result?.secure_url) {
            console.warn('Cloudinary upload warning, falling back to local URL:', error?.message || 'No URL');
            const baseUrl = process.env.PUBLIC_APP_URL || 'https://mkgold.tech';
            return resolve(`${baseUrl}/invoices/${filename}`);
          }
          console.log('Release Invoice PDF uploaded to Cloudinary:', result.secure_url);
          resolve(result.secure_url);
        }
      );
      uploadStream.end(pdfBuffer);
    } catch (uploadEx) {
      console.warn('Cloudinary upload exception:', uploadEx.message);
      const baseUrl = process.env.PUBLIC_APP_URL || 'https://mkgold.tech';
      resolve(`${baseUrl}/invoices/${filename}`);
    }
  });

  return { pdfUrl, filename };
}

module.exports = {
  createInvoicePdfBuffer,
  createReleasePdfBuffer: createInvoicePdfBuffer,
  generateAndUploadInvoice,
  generateAndUploadReleaseInvoice,
};
