import PropTypes from 'prop-types';
import { Button, Dialog, DialogTitle, DialogContent, DialogActions, Box, Stack } from '@mui/material';
import moment from 'moment';
import Iconify from './iconify';

export default function DeliveryChallanDialog({ open, onClose, melting, vendor, onProceedToSettlement }) {
  if (!melting) return null;

  const handlePrint = () => {
    const content = document.getElementById('delivery-challan-pdf');
    const pri = document.getElementById('dc-print-iframe').contentWindow;
    pri.document.open();
    pri.document.write(
      `<html><head><meta charset="utf-8"><title>Delivery Challan - ${melting?.batchNumber || ''}</title>` +
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

  const fineGold = melting?.barWeight && melting?.barPurity
    ? ((Number(melting.barWeight) * Number(melting.barPurity)) / 100).toFixed(3)
    : '0.000';

  const dcNumber = `DC-${melting?.batchNumber || moment().format('YYYYMMDD')}`;
  const dcDate = moment().format('DD/MM/YYYY, HH:mm');

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
        <span>Delivery Challan Preview</span>
        <Stack direction="row" spacing={1}>
          <Button variant="contained" color="primary" startIcon={<Iconify icon="eva:printer-fill" />} onClick={handlePrint}>
            Print DC
          </Button>
          {onProceedToSettlement && (
            <Button
              variant="contained"
              color="success"
              startIcon={<Iconify icon="eva:file-text-fill" />}
              onClick={() => {
                onClose();
                onProceedToSettlement(melting, vendor);
              }}
            >
              Enter Assay & Invoice
            </Button>
          )}
          <Button variant="outlined" color="inherit" onClick={onClose}>
            Close
          </Button>
        </Stack>
      </DialogTitle>

      <DialogContent dividers sx={{ p: { xs: 1, sm: 3 }, display: 'flex', justifyContent: 'center', bgcolor: '#80808020' }}>
        <Box sx={{ width: '100%', overflowX: 'auto', display: 'flex', justifyContent: 'center' }}>
          <iframe id="dc-print-iframe" style={{ display: 'none', height: '0px', width: '0px', position: 'absolute' }} title="delivery-challan" />

          <div
            id="delivery-challan-pdf"
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
                      <div style={{ fontSize: '15px', fontWeight: 'bold', color: '#b78103', marginBottom: '4px', textAlign: 'center' }}>
                        DELIVERY CHALLAN
                      </div>
                      <div style={{ fontSize: '10px', color: '#666', marginBottom: '6px', textAlign: 'center' }}>
                        (Rule 55 - CGST Rules, 2017)
                      </div>
                      <div style={{ fontSize: '11px' }}>
                        <strong>Challan No:</strong> {dcNumber}<br />
                        <strong>Date:</strong> {dcDate}<br />
                        <strong>Batch No:</strong> {melting?.batchNumber || '-'}
                      </div>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>

            <hr style={{ border: 'none', borderTop: '2px solid #b78103', margin: '10px 0 16px 0' }} />

            {/* Consignee / Vendor Details */}
            <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #333', marginBottom: '16px' }}>
              <thead>
                <tr style={{ backgroundColor: '#f2f2f2' }}>
                  <th style={{ border: '1px solid #333', padding: '6px 10px', textAlign: 'left', width: '50%' }}>
                    DISPATCHED TO (CONSIGNEE / VENDOR)
                  </th>
                  <th style={{ border: '1px solid #333', padding: '6px 10px', textAlign: 'left', width: '50%' }}>
                    DISPATCH DETAILS
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ border: '1px solid #333', padding: '10px', verticalAlign: 'top', fontSize: '11px', lineHeight: 1.5 }}>
                    <div style={{ fontSize: '13px', fontWeight: 'bold', marginBottom: '4px' }}>
                      {vendor?.name || 'Vendor Name N/A'}
                    </div>
                    {vendor?.contactPerson && <div><strong>Contact:</strong> {vendor.contactPerson}</div>}
                    {vendor?.phoneNumber && <div><strong>Phone:</strong> {vendor.phoneNumber}</div>}
                    {vendor?.email && <div><strong>Email:</strong> {vendor.email}</div>}
                    {vendor?.gstNumber && <div><strong>GSTIN:</strong> {vendor.gstNumber}</div>}
                    <div>
                      <strong>Address:</strong> {[vendor?.address, vendor?.city, vendor?.state].filter(Boolean).join(', ') || 'N/A'}
                    </div>
                  </td>
                  <td style={{ border: '1px solid #333', padding: '10px', verticalAlign: 'top', fontSize: '11px', lineHeight: 1.5 }}>
                    <div><strong>Purpose of Supply:</strong> For Testing / Valuation / Conversion</div>
                    <div><strong>Mode of Transport:</strong> By Hand / Authorized Carrier</div>
                    <div><strong>Place of Supply:</strong> {vendor?.state || 'Karnataka (29)'}</div>
                    <div><strong>Dispatch Status:</strong> Processed & Dispatched</div>
                  </td>
                </tr>
              </tbody>
            </table>

            {/* Goods Particulars Table */}
            <div style={{ marginBottom: '6px', fontWeight: 'bold', fontSize: '12px' }}>
              PARTICULARS OF GOODS / PRECIOUS METALS:
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #333', marginBottom: '16px' }}>
              <thead>
                <tr style={{ backgroundColor: '#f2f2f2' }}>
                  <th style={{ border: '1px solid #333', padding: '6px', textAlign: 'center', width: '5%' }}>S.No</th>
                  <th style={{ border: '1px solid #333', padding: '6px', textAlign: 'left', width: '30%' }}>Description of Goods</th>
                  <th style={{ border: '1px solid #333', padding: '6px', textAlign: 'center', width: '12%' }}>HSN Code</th>
                  <th style={{ border: '1px solid #333', padding: '6px', textAlign: 'center', width: '13%' }}>Bar Wt (g)</th>
                  <th style={{ border: '1px solid #333', padding: '6px', textAlign: 'center', width: '12%' }}>Bar Purity</th>
                  <th style={{ border: '1px solid #333', padding: '6px', textAlign: 'center', width: '14%' }}>Fine Gold (g)</th>
                  <th style={{ border: '1px solid #333', padding: '6px', textAlign: 'center', width: '14%' }}>Net Wt (g)</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ border: '1px solid #333', padding: '8px 6px', textAlign: 'center' }}>1</td>
                  <td style={{ border: '1px solid #333', padding: '8px 6px', textAlign: 'left' }}>
                    <strong>Melted Gold Bar (Gatty)</strong>
                    <div style={{ fontSize: '10px', color: '#555' }}>Batch Ref: {melting?.batchNumber || '-'}</div>
                  </td>
                  <td style={{ border: '1px solid #333', padding: '8px 6px', textAlign: 'center' }}>7108</td>
                  <td style={{ border: '1px solid #333', padding: '8px 6px', textAlign: 'center', fontWeight: 'bold' }}>
                    {melting?.barWeight ? Number(melting.barWeight).toFixed(3) : '0.000'}
                  </td>
                  <td style={{ border: '1px solid #333', padding: '8px 6px', textAlign: 'center', fontWeight: 'bold' }}>
                    {melting?.barPurity ? `${Number(melting.barPurity).toFixed(2)}%` : '0%'}
                  </td>
                  <td style={{ border: '1px solid #333', padding: '8px 6px', textAlign: 'center', fontWeight: 'bold' }}>
                    {fineGold}
                  </td>
                  <td style={{ border: '1px solid #333', padding: '8px 6px', textAlign: 'center' }}>
                    {melting?.totalNetWeight ? Number(melting.totalNetWeight).toFixed(3) : '0.000'}
                  </td>
                </tr>
                <tr style={{ backgroundColor: '#fafafa', fontWeight: 'bold' }}>
                  <td colSpan={3} style={{ border: '1px solid #333', padding: '6px', textAlign: 'right' }}>Total:</td>
                  <td style={{ border: '1px solid #333', padding: '6px', textAlign: 'center' }}>
                    {melting?.barWeight ? Number(melting.barWeight).toFixed(3) : '0.000'} g
                  </td>
                  <td style={{ border: '1px solid #333', padding: '6px', textAlign: 'center' }}>-</td>
                  <td style={{ border: '1px solid #333', padding: '6px', textAlign: 'center' }}>
                    {fineGold} g
                  </td>
                  <td style={{ border: '1px solid #333', padding: '6px', textAlign: 'center' }}>
                    {melting?.totalNetWeight ? Number(melting.totalNetWeight).toFixed(3) : '0.000'} g
                  </td>
                </tr>
              </tbody>
            </table>

            {/* Difference & Batch Details */}
            <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #333', marginBottom: '16px' }}>
              <tbody>
                <tr>
                  <td style={{ border: '1px solid #333', padding: '6px 10px', width: '25%', backgroundColor: '#f9f9f9', fontSize: '11px' }}>
                    <strong>Weight Difference:</strong>
                  </td>
                  <td style={{ border: '1px solid #333', padding: '6px 10px', width: '25%', fontSize: '11px' }}>
                    {melting?.weightDifference > 0 ? '+' : ''}{melting?.weightDifference ? Number(melting.weightDifference).toFixed(2) : '0.00'} g
                  </td>
                  <td style={{ border: '1px solid #333', padding: '6px 10px', width: '25%', backgroundColor: '#f9f9f9', fontSize: '11px' }}>
                    <strong>Purity Difference:</strong>
                  </td>
                  <td style={{ border: '1px solid #333', padding: '6px 10px', width: '25%', fontSize: '11px' }}>
                    {melting?.purityDifference > 0 ? '+' : ''}{melting?.purityDifference ? Number(melting.purityDifference).toFixed(2) : '0.00'}%
                  </td>
                </tr>
                <tr>
                  <td style={{ border: '1px solid #333', padding: '6px 10px', backgroundColor: '#f9f9f9', fontSize: '11px' }}>
                    <strong>Total Ornaments Melted:</strong>
                  </td>
                  <td style={{ border: '1px solid #333', padding: '6px 10px', fontSize: '11px' }}>
                    {melting?.totalOrnaments || 0} pcs
                  </td>
                  <td style={{ border: '1px solid #333', padding: '6px 10px', backgroundColor: '#f9f9f9', fontSize: '11px' }}>
                    <strong>Gross Weight:</strong>
                  </td>
                  <td style={{ border: '1px solid #333', padding: '6px 10px', fontSize: '11px' }}>
                    {melting?.totalGrossWeight ? Number(melting.totalGrossWeight).toFixed(3) : '0.000'} g
                  </td>
                </tr>
              </tbody>
            </table>

            {/* Terms and Declaration */}
            <div style={{ border: '1px solid #ddd', padding: '8px 10px', borderRadius: '4px', backgroundColor: '#fafafa', marginBottom: '30px', fontSize: '10px', color: '#555', lineHeight: 1.4 }}>
              <strong>Declaration:</strong><br />
              1. This Delivery Challan is issued under Rule 55 of the Central Goods and Services Tax Rules, 2017 for goods sent for valuation/inspection/processing.<br />
              2. This document is not a tax invoice. Applicable taxes, if any, shall be charged upon final settlement / invoice generation.<br />
              3. The consignee hereby acknowledges receipt of the precious metal in secure, verified, and sealed condition.
            </div>

            {/* Signatures */}
            <table style={{ width: '100%', borderCollapse: 'collapse', border: 'none', marginTop: '40px' }}>
              <tbody>
                <tr style={{ border: 'none' }}>
                  <td style={{ border: 'none', width: '50%', textAlign: 'left', verticalAlign: 'bottom', padding: 0 }}>
                    <div style={{ width: '180px', borderBottom: '1px solid #333', marginBottom: '6px' }} />
                    <div style={{ fontSize: '11px', fontWeight: 'bold' }}>Receiver's Signature & Stamp</div>
                    <div style={{ fontSize: '10px', color: '#666' }}>Name: ______________________</div>
                    <div style={{ fontSize: '10px', color: '#666' }}>Date: ______________________</div>
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
        <Button variant="contained" color="primary" startIcon={<Iconify icon="eva:printer-fill" />} onClick={handlePrint}>
          Print Delivery Challan
        </Button>
        <Button onClick={onClose} color="inherit">Close</Button>
      </DialogActions>
    </Dialog>
  );
}

DeliveryChallanDialog.propTypes = {
  open: PropTypes.bool,
  onClose: PropTypes.func,
  melting: PropTypes.object,
  vendor: PropTypes.object,
  onProceedToSettlement: PropTypes.func,
};
