const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const { cloudinary } = require('../config/cloudinary');

/**
 * Generates an official MK Gold Purchase Invoice PDF
 * @param {Object} sale - Populated sale document (with customer and branch)
 * @returns {Promise<Buffer>}
 */
function createInvoicePdfBuffer(sale) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 40, size: 'A4' });
      const buffers = [];

      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', reject);

      const branch = sale.branch || {};
      const customer = sale.customer || {};
      const ornaments = sale.ornaments || [];

      // Primary colors
      const primaryColor = '#8A1B9F';
      const textColor = '#333333';
      const grayBg = '#F7F7F7';
      const borderColor = '#CCCCCC';

      // 1. Header (Title & Logo)
      const logoPath = path.join(__dirname, '../assets/logo.png');
      if (fs.existsSync(logoPath)) {
        try {
          doc.image(logoPath, 465, 35, { width: 90 });
        } catch (e) {
          // ignore if image fails to load
        }
      }

      doc.fillColor(primaryColor)
        .fontSize(20)
        .font('Helvetica-Bold')
        .text('PURCHASE INVOICE', 40, 40);

      doc.fillColor(textColor)
        .fontSize(11)
        .font('Helvetica-Bold')
        .text(`MK Gold | ${branch.branchName || 'Head Office'}`, 40, 68);

      doc.fontSize(8)
        .font('Helvetica')
        .text(`Address: ${branch.address?.address || branch.address?.city || 'Karnataka, India'}`, 40, 83)
        .text(`Phone: 63661 11999    GST: ${branch.gstNumber || 'N/A'}`, 40, 95);

      // Invoice metadata on the right side under logo
      const invoiceDate = sale.createdAt ? new Date(sale.createdAt).toLocaleString('en-IN') : new Date().toLocaleString('en-IN');
      doc.fontSize(9)
        .font('Helvetica-Bold')
        .text(`Invoice No: ${sale.billId || 'N/A'}`, 340, 95, { align: 'right' })
        .font('Helvetica')
        .text(`Date & Time: ${invoiceDate}`, 340, 108, { align: 'right' });

      doc.moveTo(40, 125).lineTo(555, 125).strokeColor(primaryColor).lineWidth(1.5).stroke();

      // 2. Customer Details Box
      let customerY = 135;
      doc.fillColor(primaryColor).fontSize(10).font('Helvetica-Bold').text('Customer Details', 40, customerY);

      doc.rect(40, customerY + 15, 515, 60).fillColor(grayBg).fill().strokeColor(borderColor).lineWidth(0.5).stroke();

      let custAddress = 'N/A';
      if (customer.address && customer.address.length > 0) {
        const addr = customer.address[0];
        custAddress = [addr.address, addr.city, addr.state, addr.pincode].filter(Boolean).join(', ');
      }

      const maskedPhone = customer.phoneNumber
        ? `${customer.phoneNumber.slice(0, 2)}******${customer.phoneNumber.slice(-2)}`
        : 'N/A';

      doc.fillColor(textColor).fontSize(8.5);
      doc.font('Helvetica-Bold').text('Name: ', 50, customerY + 23);
      doc.font('Helvetica').text(customer.name || 'N/A', 110, customerY + 23);

      doc.font('Helvetica-Bold').text('Phone: ', 300, customerY + 23);
      doc.font('Helvetica').text(maskedPhone, 360, customerY + 23);

      doc.font('Helvetica-Bold').text('Address: ', 50, customerY + 38);
      doc.font('Helvetica').text(custAddress, 110, customerY + 38, { width: 430, height: 15, ellipsis: true });

      doc.font('Helvetica-Bold').text('ID Proof: ', 50, customerY + 53);
      doc.font('Helvetica').text(`${customer.chooseId || 'ID'}: ${customer.idNo || 'N/A'}`, 110, customerY + 53);

      // 3. Ornaments Breakdown Table
      let tableY = customerY + 90;
      doc.fillColor(primaryColor).fontSize(10).font('Helvetica-Bold').text('Ornaments Breakdown', 40, tableY);

      tableY += 15;
      const col = {
        sno: 45,
        desc: 80,
        qty: 180,
        gross: 225,
        stone: 285,
        net: 345,
        purity: 405,
        amt: 475
      };

      // Header row
      doc.rect(40, tableY, 515, 20).fillColor(primaryColor).fill();
      doc.fillColor('#FFFFFF').fontSize(8).font('Helvetica-Bold');
      doc.text('S.No', col.sno, tableY + 5);
      doc.text('Ornament Type', col.desc, tableY + 5);
      doc.text('Qty', col.qty, tableY + 5);
      doc.text('Gross (g)', col.gross, tableY + 5);
      doc.text('Stone (g)', col.stone, tableY + 5);
      doc.text('Net (g)', col.net, tableY + 5);
      doc.text('Purity', col.purity, tableY + 5);
      doc.text('Amount (Rs.)', col.amt, tableY + 5, { width: 70, align: 'right' });

      tableY += 20;
      let totalGross = 0;
      let totalStone = 0;
      let totalNet = 0;
      let totalVal = 0;

      doc.font('Helvetica').fontSize(8);
      ornaments.forEach((orn, idx) => {
        const bg = idx % 2 === 0 ? '#FFFFFF' : '#FBFBFB';
        doc.rect(40, tableY, 515, 18).fillColor(bg).fill().strokeColor(borderColor).lineWidth(0.5).stroke();

        const gross = Number(orn.grossWeight || 0);
        const stone = Number(orn.stoneWeight || 0);
        const net = Number(orn.netWeight || 0);
        const amt = Number(orn.netAmount || 0);

        totalGross += gross;
        totalStone += stone;
        totalNet += net;
        totalVal += amt;

        doc.fillColor(textColor);
        doc.text((idx + 1).toString(), col.sno, tableY + 5);
        doc.text(orn.ornamentType || 'Ornament', col.desc, tableY + 5, { width: 95, ellipsis: true });
        doc.text((orn.quantity || 1).toString(), col.qty, tableY + 5);
        doc.text(gross.toFixed(2), col.gross, tableY + 5);
        doc.text(stone.toFixed(2), col.stone, tableY + 5);
        doc.text(net.toFixed(2), col.net, tableY + 5);
        doc.text(`${orn.purity || 0}%`, col.purity, tableY + 5);
        doc.text(Math.round(amt).toLocaleString('en-IN'), col.amt, tableY + 5, { width: 70, align: 'right' });

        tableY += 18;
      });

      // Total row
      doc.rect(40, tableY, 515, 20).fillColor(grayBg).fill().strokeColor(borderColor).lineWidth(0.5).stroke();
      doc.fillColor(textColor).font('Helvetica-Bold').fontSize(8);
      doc.text('Total', col.desc, tableY + 6);
      doc.text(totalGross.toFixed(2), col.gross, tableY + 6);
      doc.text(totalStone.toFixed(2), col.stone, tableY + 6);
      doc.text(totalNet.toFixed(2), col.net, tableY + 6);
      doc.text(`Rs. ${Math.round(totalVal).toLocaleString('en-IN')}`, col.amt, tableY + 6, { width: 70, align: 'right' });

      // 4. Valuation Summary Box
      tableY += 35;
      const netAmount = Number(sale.netAmount || totalVal || 0);
      const marginPercent = Number(sale.margin || 0);
      const marginAmount = Math.round((netAmount * marginPercent) / 100);

      let cgstAmount = 0;
      let sgstAmount = 0;
      if (marginPercent >= 3) {
        cgstAmount = Math.round(netAmount * 0.015);
        sgstAmount = Math.round(netAmount * 0.015);
      } else {
        cgstAmount = Math.round(marginAmount * 0.25);
        sgstAmount = Math.round(marginAmount * 0.25);
      }

      const payableAmount = Number(sale.payableAmount || (netAmount - marginAmount));

      doc.fillColor(primaryColor).fontSize(10).font('Helvetica-Bold').text('Valuation & Payment Summary', 300, tableY);
      tableY += 15;

      const summaryRows = [
        ['Gold Rate (per gm):', `Rs. ${(sale.goldRate || 0).toLocaleString('en-IN')}`],
        ['Gross Amount:', `Rs. ${Math.round(netAmount).toLocaleString('en-IN')}`],
        [`Company Margin (${marginPercent}%):`, `- Rs. ${marginAmount.toLocaleString('en-IN')}`],
        ['CGST (1.5%):', `Rs. ${cgstAmount.toLocaleString('en-IN')}`],
        ['SGST (1.5%):', `Rs. ${sgstAmount.toLocaleString('en-IN')}`],
        ['Net Payable Amount:', `Rs. ${Math.round(payableAmount).toLocaleString('en-IN')}`]
      ];

      doc.rect(300, tableY, 255, summaryRows.length * 18).fillColor(grayBg).fill().strokeColor(borderColor).lineWidth(0.5).stroke();

      summaryRows.forEach(([lbl, val], idx) => {
        const rowY = tableY + (idx * 18) + 5;
        const isTotal = idx === summaryRows.length - 1;

        if (isTotal) {
          doc.rect(300, rowY - 5, 255, 18).fillColor('#E8D5EC').fill();
          doc.fillColor(primaryColor).font('Helvetica-Bold').fontSize(9);
        } else {
          doc.fillColor(textColor).font('Helvetica').fontSize(8.5);
        }

        doc.text(lbl, 310, rowY);
        doc.text(val, 430, rowY, { width: 115, align: 'right' });
      });

      // 5. Terms and Footer
      const footerY = 730;
      doc.moveTo(40, footerY).lineTo(555, footerY).strokeColor(borderColor).lineWidth(0.5).stroke();
      doc.fillColor('#666666').fontSize(7.5).font('Helvetica');
      doc.text('Terms & Conditions:', 40, footerY + 8);
      doc.text('1. Gold ornaments sold once cannot be returned or cancelled.', 40, footerY + 18);
      doc.text('2. Payment transferred directly to customer bank account / cash as per agreed receipt.', 40, footerY + 28);
      doc.text('Thank you for choosing MK Gold World! Visit us at www.mkgold.in', 40, footerY + 45, { align: 'center', width: 515 });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

/**
 * Uploads an invoice PDF buffer to Cloudinary and saves a local copy in public/invoices
 * @param {Buffer} pdfBuffer
 * @param {String} billId
 * @returns {Promise<String>} Public HTTPS URL
 */
async function uploadInvoicePdf(pdfBuffer, billId, customFilename) {
  const filename = customFilename || `MKGold_Invoice_${billId}.pdf`;

  // 1. Save local copy in public/invoices folder for static serving
  try {
    const publicInvoicesDir = path.join(__dirname, '../public/invoices');
    if (!fs.existsSync(publicInvoicesDir)) {
      fs.mkdirSync(publicInvoicesDir, { recursive: true });
    }
    fs.writeFileSync(path.join(publicInvoicesDir, filename), pdfBuffer);
  } catch (localErr) {
    console.warn('Failed to save local invoice copy:', localErr.message);
  }

  // 2. Upload to Cloudinary to obtain a CDN public HTTPS link
  return new Promise((resolve) => {
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
}

/**
 * Generates an official MK Gold Gold Release & Purchase Receipt PDF
 * @param {Object} sale - Populated sale document (with customer and branch)
 * @returns {Promise<Buffer>}
 */
function createReleasePdfBuffer(sale) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 40, size: 'A4' });
      const buffers = [];

      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', reject);

      const branch = sale.branch || {};
      const customer = sale.customer || {};
      const releases = sale.release || [];
      const ornaments = (sale.ornaments && sale.ornaments.length > 0) 
        ? sale.ornaments 
        : (releases[0]?.ornaments || []);

      // Primary colors
      const primaryColor = '#8A1B9F';
      const textColor = '#333333';
      const grayBg = '#F7F7F7';
      const borderColor = '#CCCCCC';

      // 1. Header (Title & Logo)
      const logoPath = path.join(__dirname, '../assets/logo.png');
      if (fs.existsSync(logoPath)) {
        try {
          doc.image(logoPath, 465, 30, { width: 90 });
        } catch (e) {}
      }

      doc.fillColor(primaryColor)
        .fontSize(18)
        .font('Helvetica-Bold')
        .text('GOLD RELEASE & PURCHASE RECEIPT', 40, 35);

      doc.fillColor(textColor)
        .fontSize(10.5)
        .font('Helvetica-Bold')
        .text(`MK Gold | ${branch.branchName || 'Head Office'}`, 40, 58);

      doc.fontSize(8)
        .font('Helvetica')
        .text(`Address: ${branch.address?.address || branch.address?.city || 'Karnataka, India'}`, 40, 72)
        .text(`Phone: 63661 11999    GST: ${branch.gstNumber || 'N/A'}`, 40, 83);

      const invoiceDate = sale.createdAt ? new Date(sale.createdAt).toLocaleString('en-IN') : new Date().toLocaleString('en-IN');
      doc.fontSize(8.5)
        .font('Helvetica-Bold')
        .text(`Bill ID: ${sale.billId || 'N/A'}`, 340, 80, { align: 'right' })
        .font('Helvetica')
        .text(`Date & Time: ${invoiceDate}`, 340, 92, { align: 'right' });

      doc.moveTo(40, 105).lineTo(555, 105).strokeColor(primaryColor).lineWidth(1.5).stroke();

      // 2. Customer Details Box
      let currentY = 112;
      doc.fillColor(primaryColor).fontSize(9.5).font('Helvetica-Bold').text('Customer Details', 40, currentY);

      doc.rect(40, currentY + 12, 515, 46).fillColor(grayBg).fill().strokeColor(borderColor).lineWidth(0.5).stroke();

      let custAddress = 'N/A';
      if (customer.address && customer.address.length > 0) {
        const addr = customer.address[0];
        custAddress = [addr.address, addr.city, addr.state, addr.pincode].filter(Boolean).join(', ');
      }

      const maskedPhone = customer.phoneNumber
        ? `${customer.phoneNumber.slice(0, 2)}******${customer.phoneNumber.slice(-2)}`
        : 'N/A';

      doc.fillColor(textColor).fontSize(8);
      doc.font('Helvetica-Bold').text('Name: ', 50, currentY + 18);
      doc.font('Helvetica').text(customer.name || 'N/A', 100, currentY + 18);

      doc.font('Helvetica-Bold').text('Phone: ', 300, currentY + 18);
      doc.font('Helvetica').text(maskedPhone, 345, currentY + 18);

      doc.font('Helvetica-Bold').text('Address: ', 50, currentY + 30);
      doc.font('Helvetica').text(custAddress, 100, currentY + 30, { width: 440, height: 12, ellipsis: true });

      doc.font('Helvetica-Bold').text('ID Proof: ', 50, currentY + 42);
      doc.font('Helvetica').text(`${customer.chooseId || 'ID'}: ${customer.idNo || 'N/A'}`, 100, currentY + 42);

      // 3. Bank / Gold Loan Information Box
      currentY += 66;
      doc.fillColor(primaryColor).fontSize(9.5).font('Helvetica-Bold').text('Gold Loan / Pledge Details', 40, currentY);

      doc.rect(40, currentY + 12, 515, 46).fillColor('#FAF5FC').fill().strokeColor('#E0D0E8').lineWidth(0.5).stroke();

      const bankNames = releases.map(r => r.pledgedIn).filter(Boolean).join(', ') || 'N/A';
      const pledgeIds = releases.map(r => r.pledgeId).filter(Boolean).join(', ') || 'N/A';
      const pledgedBranches = releases.map(r => r.pledgedBranch).filter(Boolean).join(', ') || branch.branchName || 'N/A';
      const totalPledgeAmt = releases.reduce((sum, r) => sum + (Number(r.pledgeAmount) || 0), 0);
      const totalReleasePayable = releases.reduce((sum, r) => sum + (Number(r.payableAmount) || 0), 0);
      const effectiveReleaseCharge = totalPledgeAmt > 0 ? totalPledgeAmt : totalReleasePayable;

      doc.fillColor(textColor).fontSize(8);
      doc.font('Helvetica-Bold').text('Pledged Bank / Fin: ', 50, currentY + 18);
      doc.font('Helvetica').text(bankNames, 140, currentY + 18, { width: 155, ellipsis: true });

      doc.font('Helvetica-Bold').text('Gold Loan / Pledge ID: ', 310, currentY + 18);
      doc.font('Helvetica').text(pledgeIds, 410, currentY + 18, { width: 140, ellipsis: true });

      doc.font('Helvetica-Bold').text('Pledged Branch: ', 50, currentY + 32);
      doc.font('Helvetica').text(pledgedBranches, 140, currentY + 32, { width: 155, ellipsis: true });

      doc.font('Helvetica-Bold').text('Bank Release Amount: ', 310, currentY + 32);
      doc.font('Helvetica-Bold').fillColor(primaryColor).text(`Rs. ${Math.round(effectiveReleaseCharge).toLocaleString('en-IN')}`, 410, currentY + 32);

      // 4. Ornaments Breakdown Table
      currentY += 66;
      doc.fillColor(primaryColor).fontSize(9.5).font('Helvetica-Bold').text('Released Ornaments Breakdown', 40, currentY);

      currentY += 12;
      const col = {
        sno: 45,
        desc: 75,
        qty: 190,
        gross: 240,
        stone: 295,
        net: 350,
        purity: 410,
        amt: 475
      };

      // Header row
      doc.rect(40, currentY, 515, 18).fillColor(primaryColor).fill();
      doc.fillColor('#FFFFFF').fontSize(7.5).font('Helvetica-Bold');
      doc.text('S.No', col.sno, currentY + 5);
      doc.text('Ornament Type', col.desc, currentY + 5);
      doc.text('Qty', col.qty, currentY + 5);
      doc.text('Gross (g)', col.gross, currentY + 5);
      doc.text('Stone (g)', col.stone, currentY + 5);
      doc.text('Net (g)', col.net, currentY + 5);
      doc.text('Purity', col.purity, currentY + 5);
      doc.text('Amount (Rs.)', col.amt, currentY + 5, { width: 70, align: 'right' });

      currentY += 18;
      let totalGross = 0;
      let totalStone = 0;
      let totalNet = 0;
      let totalVal = 0;

      doc.font('Helvetica').fontSize(7.5);
      if (ornaments && ornaments.length > 0) {
        ornaments.forEach((orn, idx) => {
          const bg = idx % 2 === 0 ? '#FFFFFF' : '#FBFBFB';
          doc.rect(40, currentY, 515, 16).fillColor(bg).fill().strokeColor(borderColor).lineWidth(0.5).stroke();

          const gross = Number(orn.grossWeight || 0);
          const stone = Number(orn.stoneWeight || 0);
          const net = Number(orn.netWeight || 0);
          const amt = Number(orn.netAmount || 0);

          totalGross += gross;
          totalStone += stone;
          totalNet += net;
          totalVal += amt;

          doc.fillColor(textColor);
          doc.text((idx + 1).toString(), col.sno, currentY + 4);
          doc.text(orn.ornamentType || 'Ornament', col.desc, currentY + 4, { width: 110, ellipsis: true });
          doc.text((orn.quantity || 1).toString(), col.qty, currentY + 4);
          doc.text(gross.toFixed(2), col.gross, currentY + 4);
          doc.text(stone.toFixed(2), col.stone, currentY + 4);
          doc.text(net.toFixed(2), col.net, currentY + 4);
          doc.text(`${orn.purity || 0}%`, col.purity, currentY + 4);
          doc.text(Math.round(amt).toLocaleString('en-IN'), col.amt, currentY + 4, { width: 70, align: 'right' });

          currentY += 16;
        });
      } else {
        const net = Number(sale.netWeight || 0);
        totalGross = net;
        totalNet = net;
        totalVal = Number(sale.netAmount || 0);

        doc.rect(40, currentY, 515, 16).fillColor('#FFFFFF').fill().strokeColor(borderColor).lineWidth(0.5).stroke();
        doc.fillColor(textColor);
        doc.text('1', col.sno, currentY + 4);
        doc.text('Released Gold Ornaments', col.desc, currentY + 4, { width: 110, ellipsis: true });
        doc.text('1', col.qty, currentY + 4);
        doc.text(net.toFixed(2), col.gross, currentY + 4);
        doc.text('0.00', col.stone, currentY + 4);
        doc.text(net.toFixed(2), col.net, currentY + 4);
        doc.text('-', col.purity, currentY + 4);
        doc.text(Math.round(totalVal).toLocaleString('en-IN'), col.amt, currentY + 4, { width: 70, align: 'right' });

        currentY += 16;
      }

      // Total row
      doc.rect(40, currentY, 515, 18).fillColor(grayBg).fill().strokeColor(borderColor).lineWidth(0.5).stroke();
      doc.fillColor(textColor).font('Helvetica-Bold').fontSize(7.5);
      doc.text('Total', col.desc, currentY + 5);
      doc.text(totalGross.toFixed(2), col.gross, currentY + 5);
      doc.text(totalStone.toFixed(2), col.stone, currentY + 5);
      doc.text(totalNet.toFixed(2), col.net, currentY + 5);
      doc.text(`Rs. ${Math.round(totalVal || sale.netAmount || 0).toLocaleString('en-IN')}`, col.amt, currentY + 5, { width: 70, align: 'right' });

      // 5. Valuation & Settlement Summary Box
      currentY += 26;
      const netAmount = Number(sale.netAmount || totalVal || 0);
      const marginPercent = Number(sale.margin || 0);
      const marginAmount = Math.round((netAmount * marginPercent) / 100);

      let cgstAmount = 0;
      let sgstAmount = 0;
      if (marginPercent >= 3) {
        cgstAmount = Math.round(netAmount * 0.015);
        sgstAmount = Math.round(netAmount * 0.015);
      } else {
        cgstAmount = Math.round(marginAmount * 0.25);
        sgstAmount = Math.round(marginAmount * 0.25);
      }

      const payableAmount = Number(sale.payableAmount || 0);

      doc.fillColor(primaryColor).fontSize(9.5).font('Helvetica-Bold').text('Valuation & Settlement Summary', 300, currentY);
      currentY += 12;

      const summaryRows = [
        ['Gold Rate (per gm):', `Rs. ${(sale.goldRate || 0).toLocaleString('en-IN')}`],
        ['Gross Valuation Amount:', `Rs. ${Math.round(netAmount).toLocaleString('en-IN')}`],
        [`Company Margin (${marginPercent}%):`, `- Rs. ${marginAmount.toLocaleString('en-IN')}`],
        ['CGST (1.5%):', `Rs. ${cgstAmount.toLocaleString('en-IN')}`],
        ['SGST (1.5%):', `Rs. ${sgstAmount.toLocaleString('en-IN')}`],
        ['Bank Release Amount (Paid):', `- Rs. ${Math.round(effectiveReleaseCharge).toLocaleString('en-IN')}`],
        ['Net Payable to Customer:', `Rs. ${Math.round(payableAmount).toLocaleString('en-IN')}`]
      ];

      doc.rect(300, currentY, 255, summaryRows.length * 16).fillColor(grayBg).fill().strokeColor(borderColor).lineWidth(0.5).stroke();

      summaryRows.forEach(([lbl, val], idx) => {
        const rowY = currentY + (idx * 16) + 4;
        const isTotal = idx === summaryRows.length - 1;

        if (isTotal) {
          doc.rect(300, rowY - 4, 255, 16).fillColor('#E8D5EC').fill();
          doc.fillColor(primaryColor).font('Helvetica-Bold').fontSize(8.5);
        } else {
          doc.fillColor(textColor).font('Helvetica').fontSize(7.5);
        }

        doc.text(lbl, 308, rowY);
        doc.text(val, 420, rowY, { width: 125, align: 'right' });
      });

      // 6. Terms & Customer Declaration & Signatures
      currentY += (summaryRows.length * 16) + 16;

      doc.rect(40, currentY, 515, 54).fillColor('#FAFAFA').fill().strokeColor(borderColor).lineWidth(0.5).stroke();
      doc.fillColor('#444444').fontSize(7).font('Helvetica');
      doc.text('Customer Declaration & Terms:', 48, currentY + 5, { font: 'Helvetica-Bold' });
      doc.text('1. I hereby confirm that the gold ornaments were lawfully pledged by me and released with my authorization.', 48, currentY + 14);
      doc.text('2. The bank release amount has been settled and remaining balance is credited to my account / paid as agreed.', 48, currentY + 23);
      doc.text('3. This buyback transaction is final and binding once completed.', 48, currentY + 32);
      doc.text('Thank you for choosing MK Gold World! Visit www.mkgold.in | Helpline: 63661 11999', 48, currentY + 43, { align: 'center', width: 499 });

      // Signatures
      currentY += 68;
      doc.moveTo(60, currentY).lineTo(200, currentY).strokeColor(borderColor).lineWidth(1).stroke();
      doc.moveTo(395, currentY).lineTo(535, currentY).strokeColor(borderColor).lineWidth(1).stroke();

      doc.fillColor(textColor).fontSize(7.5).font('Helvetica-Bold');
      doc.text('Customer Signature', 60, currentY + 4, { width: 140, align: 'center' });
      doc.text('Authorized Signatory (MK Gold)', 395, currentY + 4, { width: 140, align: 'center' });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

/**
 * High-level helper: generates the Physical Invoice PDF and uploads it
 * @param {Object} sale
 * @returns {Promise<{ pdfUrl: String, filename: String }>}
 */
async function generateAndUploadInvoice(sale) {
  const buffer = await createInvoicePdfBuffer(sale);
  const filename = `MKGold_Invoice_${sale.billId || 'BILL'}.pdf`;
  const pdfUrl = await uploadInvoicePdf(buffer, sale.billId || 'BILL');
  return { pdfUrl, filename };
}

/**
 * High-level helper: generates the Release Receipt PDF and uploads it
 * @param {Object} sale
 * @returns {Promise<{ pdfUrl: String, filename: String }>}
 */
async function generateAndUploadReleaseInvoice(sale) {
  const buffer = await createReleasePdfBuffer(sale);
  const filename = `MKGold_ReleaseReceipt_${sale.billId || 'BILL'}.pdf`;
  const pdfUrl = await uploadInvoicePdf(buffer, sale.billId || 'BILL', filename);
  return { pdfUrl, filename: 'gold_release_receipt.pdf' };
}

module.exports = {
  createInvoicePdfBuffer,
  createReleasePdfBuffer,
  uploadInvoicePdf,
  generateAndUploadInvoice,
  generateAndUploadReleaseInvoice,
};
