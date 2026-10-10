import PropTypes from 'prop-types';
import { Button, Dialog, DialogTitle, DialogContent, DialogActions, Box, Stack } from '@mui/material';
import moment from 'moment';
import Iconify from './iconify';

export default function GoldSaleInvoiceDialog({ open, onClose, melting, vendor }) {
  if (!melting) return null;

  const currentVendor = vendor || melting?.vendor;

  const handlePrint = () => {
    const content = document.getElementById('gold-invoice-pdf');
    const pri = document.getElementById('invoice-print-iframe').contentWindow;
    pri.document.open();
    pri.document.write(
      `<html><head><meta charset="utf-8"><title>Invoice - ${melting?.invoiceNumber || melting?.batchNumber || ''}</title>` +
      `<style>` +
      `@page { size: A4 portrait; margin: 10mm; } ` +
      `body { margin: 0; font-family: Arial, sans-serif; font-size: 12px; color: #000; } ` +
      `table { width: 100%; border-collapse: collapse; } ` +
      `th, td { border: 1px solid #333; padding: 6px 8px; font-size: 11px; } ` +
      `th { background-color: #f2f2f2; font-weight: bold; } ` +
      `</style></head><body>` +
      content.outerHTML +
      `</body></html>`
    );
    pri.document.close();
    setTimeout(() => {
      pri.focus();
      pri.print();
    }, 250);
  };

  const actualWeight = melting?.actualWeight || melting?.barWeight || 0;
  const actualPurity = melting?.actualPurity || melting?.barPurity || 0;
  const fineGold = ((Number(actualWeight) * Number(actualPurity)) / 100).toFixed(3);
  const goldRate = Number(melting?.goldRate) || 0;
  const totalAmount = Number(melting?.sellAmount) || 0;
  const invoiceNumber = melting?.invoiceNumber || `INV-${melting?.batchNumber || moment().format('YYYYMMDD')}`;
  const invoiceDate = melting?.invoiceDate ? moment(melting.invoiceDate).format('DD/MM/YYYY, HH:mm') : moment().format('DD/MM/YYYY, HH:mm');

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="md" 
      fullWidth
      PaperProps={{
        sx: {
          maxHeight: '92vh',
          m: { xs: 1.5, sm: 3 },
          borderRadius: 2,
        },
      }}
    >
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>Tax Invoice Preview</span>
        <Stack direction="row" spacing={1}>
          <Button variant="contained" color="success" startIcon={<Iconify icon="eva:printer-fill" />} onClick={handlePrint}>
            Print Invoice
          </Button>
          <Button variant="outlined" color="inherit" onClick={onClose}>
            Close
          </Button>
        </Stack>
      </DialogTitle>

      <DialogContent dividers sx={{ p: { xs: 1, sm: 3 }, display: 'flex', justifyContent: 'center', bgcolor: '#80808020' }}>
        <Box sx={{ width: '100%', overflowX: 'auto', display: 'flex', justifyContent: 'center' }}>
          <iframe id="invoice-print-iframe" style={{ display: 'none', height: '0px', width: '0px', position: 'absolute' }} title="gold-invoice" />

          <div
            id="gold-invoice-pdf"
            style={{
              color: '#000',
              backgroundColor: '#fff',
              padding: '24px 30px',
              fontFamily: 'Arial, sans-serif',
              fontSize: '12px',
              width: '210mm',
              minHeight: '270mm',
              margin: '0 auto',
              boxSizing: 'border-box',
              border: '1px solid #ddd',
              boxShadow: '0 0 10px rgba(0,0,0,0.1)',
            }}
          >
            {/* Header */}
            <table style={{ width: '100%', borderCollapse: 'collapse', border: 'none', marginBottom: '12px' }}>
              <tbody>
                <tr style={{ border: 'none' }}>
                  <td style={{ border: 'none', verticalAlign: 'top', width: '60%', padding: 0 }}>
                    <img
                      alt="MK Gold Logo"
                      src="/assets/icons/navbar/MK%20Gold%20Logo.png"
                      style={{ width: '130px', height: 'auto', objectFit: 'contain', marginBottom: '6px' }}
                      onError={(e) => { e.target.style.display = 'none'; }}
                    />
                    <div style={{ fontSize: '11px', color: '#444', lineHeight: 1.4 }}>
                      <strong>MK GOLD PRIVATE LIMITED</strong><br />
                      Head Office: Bangalore, Karnataka<br />
                      Phone: +91 63661 11999 | Email: info@mkgold.tech<br />
                      GSTIN: 29AABCM1234F1Z5
                    </div>
                  </td>
                  <td style={{ border: 'none', textAlign: 'right', verticalAlign: 'top', width: '40%', padding: 0 }}>
                    <div style={{ display: 'inline-block', textAlign: 'left', border: '1px solid #333', padding: '8px 12px', borderRadius: '4px', backgroundColor: '#fafafa' }}>
                      <div style={{ fontSize: '15px', fontWeight: 'bold', color: '#1b5e20', marginBottom: '4px', textAlign: 'center' }}>
                        TAX INVOICE
                      </div>
                      <div style={{ fontSize: '10px', color: '#666', marginBottom: '6px', textAlign: 'center' }}>
                        (Sale of Gold Bullion / Gatty)
                      </div>
                      <div style={{ fontSize: '11px' }}>
                        <strong>Invoice No:</strong> {invoiceNumber}<br />
                        <strong>Invoice Date:</strong> {invoiceDate}<br />
                        <strong>Batch No:</strong> {melting?.batchNumber || '-'}<br />
                        {melting?.dcNumber && <><strong>DC Ref:</strong> {melting.dcNumber}<br /></>}
                      </div>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>

            <hr style={{ border: 'none', borderTop: '2px solid #1b5e20', margin: '10px 0 16px 0' }} />

            {/* Buyer Details */}
            <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #333', marginBottom: '16px' }}>
              <thead>
                <tr style={{ backgroundColor: '#f2f2f2' }}>
                  <th style={{ border: '1px solid #333', padding: '6px 10px', textAlign: 'left', width: '50%' }}>
                    BILLED TO (BUYER / VENDOR)
                  </th>
                  <th style={{ border: '1px solid #333', padding: '6px 10px', textAlign: 'left', width: '50%' }}>
                    PAYMENT & SETTLEMENT DETAILS
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ border: '1px solid #333', padding: '10px', verticalAlign: 'top', fontSize: '11px', lineHeight: 1.5 }}>
                    <div style={{ fontSize: '13px', fontWeight: 'bold', marginBottom: '4px' }}>
                      {currentVendor?.name || 'Vendor Name N/A'}
                    </div>
                    {currentVendor?.contactPerson && <div><strong>Contact:</strong> {currentVendor.contactPerson}</div>}
                    {currentVendor?.phoneNumber && <div><strong>Phone:</strong> {currentVendor.phoneNumber}</div>}
                    {currentVendor?.gstNumber && <div><strong>GSTIN:</strong> {currentVendor.gstNumber}</div>}
                    <div>
                      <strong>Address:</strong> {[currentVendor?.address, currentVendor?.city, currentVendor?.state].filter(Boolean).join(', ') || 'N/A'}
                    </div>
                  </td>
                  <td style={{ border: '1px solid #333', padding: '10px', verticalAlign: 'top', fontSize: '11px', lineHeight: 1.5 }}>
                    <div><strong>Payment Mode:</strong> {melting?.paymentMode || 'Bank Transfer'}</div>
                    <div><strong>Settlement Status:</strong> Completed</div>
                    <div><strong>Place of Supply:</strong> {currentVendor?.state || 'Karnataka (29)'}</div>
                    <div><strong>Invoice Currency:</strong> INR (₹)</div>
                  </td>
                </tr>
              </tbody>
            </table>

            {/* Items Table */}
            <div style={{ marginBottom: '6px', fontWeight: 'bold', fontSize: '12px' }}>
              DESCRIPTION OF GOODS SOLD:
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #333', marginBottom: '16px' }}>
              <thead>
                <tr style={{ backgroundColor: '#f2f2f2' }}>
                  <th style={{ border: '1px solid #333', padding: '6px', textAlign: 'center', width: '5%' }}>S.No</th>
                  <th style={{ border: '1px solid #333', padding: '6px', textAlign: 'left', width: '28%' }}>Description</th>
                  <th style={{ border: '1px solid #333', padding: '6px', textAlign: 'center', width: '10%' }}>HSN Code</th>
                  <th style={{ border: '1px solid #333', padding: '6px', textAlign: 'center', width: '12%' }}>Gatty Wt (g)</th>
                  <th style={{ border: '1px solid #333', padding: '6px', textAlign: 'center', width: '11%' }}>Purity (%)</th>
                  <th style={{ border: '1px solid #333', padding: '6px', textAlign: 'center', width: '12%' }}>Fine Gold (g)</th>
                  <th style={{ border: '1px solid #333', padding: '6px', textAlign: 'center', width: '10%' }}>Rate (₹/g)</th>
                  <th style={{ border: '1px solid #333', padding: '6px', textAlign: 'right', width: '12%' }}>Amount (₹)</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ border: '1px solid #333', padding: '8px 6px', textAlign: 'center' }}>1</td>
                  <td style={{ border: '1px solid #333', padding: '8px 6px', textAlign: 'left' }}>
                    <strong>Melted Gold Bar (Gatty)</strong>
                    <div style={{ fontSize: '10px', color: '#555' }}>Batch: {melting?.batchNumber || '-'}</div>
                  </td>
                  <td style={{ border: '1px solid #333', padding: '8px 6px', textAlign: 'center' }}>7108</td>
                  <td style={{ border: '1px solid #333', padding: '8px 6px', textAlign: 'center', fontWeight: 'bold' }}>
                    {Number(actualWeight).toFixed(3)}
                  </td>
                  <td style={{ border: '1px solid #333', padding: '8px 6px', textAlign: 'center', fontWeight: 'bold' }}>
                    {Number(actualPurity).toFixed(2)}%
                  </td>
                  <td style={{ border: '1px solid #333', padding: '8px 6px', textAlign: 'center', fontWeight: 'bold' }}>
                    {fineGold}
                  </td>
                  <td style={{ border: '1px solid #333', padding: '8px 6px', textAlign: 'center' }}>
                    ₹{goldRate.toLocaleString('en-IN')}
                  </td>
                  <td style={{ border: '1px solid #333', padding: '8px 6px', textAlign: 'right', fontWeight: 'bold' }}>
                    ₹{totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                </tr>
                <tr style={{ backgroundColor: '#fafafa', fontWeight: 'bold' }}>
                  <td colSpan={3} style={{ border: '1px solid #333', padding: '8px 6px', textAlign: 'right' }}>Total:</td>
                  <td style={{ border: '1px solid #333', padding: '8px 6px', textAlign: 'center' }}>{Number(actualWeight).toFixed(3)} g</td>
                  <td style={{ border: '1px solid #333', padding: '8px 6px', textAlign: 'center' }}>-</td>
                  <td style={{ border: '1px solid #333', padding: '8px 6px', textAlign: 'center' }}>{fineGold} g</td>
                  <td style={{ border: '1px solid #333', padding: '8px 6px', textAlign: 'center' }}>-</td>
                  <td style={{ border: '1px solid #333', padding: '8px 6px', textAlign: 'right', fontSize: '13px', color: '#1b5e20' }}>
                    ₹{totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                </tr>
              </tbody>
            </table>

            {/* Total in words */}
            <div style={{ border: '1px solid #333', padding: '8px 12px', backgroundColor: '#f9f9f9', marginBottom: '20px', fontSize: '11px' }}>
              <strong>Net Amount:</strong> ₹{totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>

            {/* Bank Details */}
            <div style={{ border: '1px solid #ddd', padding: '8px 10px', borderRadius: '4px', backgroundColor: '#fafafa', marginBottom: '25px', fontSize: '10px', color: '#555', lineHeight: 1.4 }}>
              <strong>Bank Account Details for Settlement:</strong><br />
              Account Name: MK GOLD PRIVATE LIMITED | Bank: HDFC Bank | A/C No: 50200088991122 | IFSC: HDFC0001234
            </div>

            {/* Terms & Signatures */}
            <table style={{ width: '100%', borderCollapse: 'collapse', border: 'none', marginTop: '30px' }}>
              <tbody>
                <tr style={{ border: 'none' }}>
                  <td style={{ border: 'none', width: '50%', textAlign: 'left', verticalAlign: 'bottom', padding: 0 }}>
                    <div style={{ width: '180px', borderBottom: '1px solid #333', marginBottom: '6px' }} />
                    <div style={{ fontSize: '11px', fontWeight: 'bold' }}>Buyer's Signature</div>
                    <div style={{ fontSize: '10px', color: '#666' }}>Authorized Person</div>
                  </td>
                  <td style={{ border: 'none', width: '50%', textAlign: 'right', verticalAlign: 'bottom', padding: 0 }}>
                    <div style={{ fontSize: '11px', fontWeight: 'bold', marginBottom: '40px' }}>For MK GOLD PRIVATE LIMITED</div>
                    <div style={{ display: 'inline-block', width: '180px', borderBottom: '1px solid #333', marginBottom: '6px' }} />
                    <div style={{ fontSize: '11px', fontWeight: 'bold' }}>Authorized Signatory</div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </Box>
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button variant="contained" color="success" startIcon={<Iconify icon="eva:printer-fill" />} onClick={handlePrint}>
          Print Invoice
        </Button>
        <Button onClick={onClose} color="inherit">Close</Button>
      </DialogActions>
    </Dialog>
  );
}

GoldSaleInvoiceDialog.propTypes = {
  open: PropTypes.bool,
  onClose: PropTypes.func,
  melting: PropTypes.object,
  vendor: PropTypes.object,
};
