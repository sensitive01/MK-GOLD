import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { Button, Dialog, DialogTitle, DialogContent, DialogActions, Box } from '@mui/material';
import moment from 'moment';
import { getTransitById } from '../../../apis/branch/transit';
import Iconify from '../../iconify';
import global from '../../../utils/global';

export default function TransitPrint({ id, open, onClose }) {
  const [data, setData] = useState({});

  useEffect(() => {
    if (id && open) {
      getTransitById(id).then((res) => {
        if (res && res.data) {
          setData(res.data);
        }
      });
    }
  }, [id, open]);

  if (!data || Object.keys(data).length === 0) {
    return null;
  }

  // Calculate table rows from saleIds
  const tableRows = [];
  if (data?.saleIds && data.saleIds.length > 0) {
    data.saleIds.forEach((sale, index) => {
      // no.of ornaments
      let numberOfOrnaments = 0;
      let grossWeight = 0;
      if (sale.ornaments && sale.ornaments.length > 0) {
        numberOfOrnaments = sale.ornaments.reduce((acc, curr) => acc + (Number(curr.quantity) || 1), 0);
        grossWeight = sale.ornaments.reduce((acc, curr) => acc + (Number(curr.grossWeight) || 0), 0);
      } else {
        // For release/pledged, maybe take weight from sale.weight
        grossWeight = sale.netWeight || 0; // fallback
      }

      tableRows.push({
        sno: index + 1,
        billId: sale.billId || '',
        customerName: sale.customer?.name || '',
        type: sale.purchaseType || '',
        saleType: sale.saleType || '',
        numberOfOrnaments: numberOfOrnaments,
        grossWeight: grossWeight,
        netWeight: sale.netWeight || 0,
        netAmount: sale.netAmount || 0,
        billDate: sale.createdAt ? moment(sale.createdAt).format('DD/MM/YYYY') : ''
      });
    });
  }

  const totalOrnaments = tableRows.reduce((acc, row) => acc + row.numberOfOrnaments, 0);
  const totalGrossWeight = tableRows.reduce((acc, row) => acc + row.grossWeight, 0);
  const totalNetWeight = tableRows.reduce((acc, row) => acc + row.netWeight, 0);
  const totalNetAmount = tableRows.reduce((acc, row) => acc + row.netAmount, 0);

  const handlePrint = () => {
    const content = document.getElementById('transit-print-pdf');
    const pri = document.getElementById('transit-iframe').contentWindow;
    pri.document.open();
    pri.document.write(`<html><head><meta charset="utf-8"><title>Print Transit</title><style>@page { size: A4; margin: 0mm; } body { margin: 0; box-sizing: border-box; }</style></head><body style="margin:0;">` + content.outerHTML + '</body></html>');
    pri.document.close();
    pri.onload = () => {
      pri.focus();
      pri.print();
    };
  };

  const preparerName = data?.createdEmployee?.name || '';
  const preparerEmpId = data?.createdEmployee?.employeeId || '';

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>Verify Transit Details</DialogTitle>
      <DialogContent sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
        <Box sx={{ overflowX: 'auto', width: '100%' }}>
          <iframe id="transit-iframe" style={{ display: 'none', height: '0px', width: '0px', position: 'absolute' }} title="pdf" />
          
          <div id="transit-print-pdf" style={{ color: '#000', backgroundColor: '#fff', padding: '30px', fontFamily: 'Arial, sans-serif', fontSize: '12px', width: '210mm', minHeight: '297mm', margin: '0 auto', boxSizing: 'border-box' }}>
            
            {/* Header Section */}
            <div style={{ textAlign: 'center', marginBottom: '15px' }}>
              <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 'bold' }}>Business Transit</h2>
              <p style={{ margin: 0, fontSize: '16px', fontWeight: 'bold' }}>({data?.createdAt ? moment(data.createdAt).format('DD/MM/YYYY HH:mm:ss') : ''})</p>
            </div>
            
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px' }}>
              <tbody>
                <tr>
                  <td style={{ verticalAlign: 'top', width: '50%', paddingTop: '10px' }}>
                    <img
                      alt="Logo"
                      src="/assets/icons/navbar/MK%20Gold%20Logo.png"
                      style={{ width: '120px', height: 'auto', objectFit: 'contain', marginBottom: '10px' }}
                      onError={(e) => { e.target.style.display = 'none'; }}
                    />
                    <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 'bold' }}>
                      Branch: {data?.branch?.branchName || ''}
                    </h3>
                  </td>
                  <td style={{ textAlign: 'right', verticalAlign: 'top', width: '50%', paddingTop: '10px' }}>
                    <p style={{ margin: '0 0 5px 0', fontSize: '12px', color: '#333' }}>
                      <strong>Address:</strong> {data?.branch?.address?.address || data?.branch?.address?.city || ''}
                    </p>
                    <p style={{ margin: 0, fontSize: '12px', color: '#333' }}>
                      <strong>Phone:</strong> 63661 11999
                    </p>
                  </td>
                </tr>
              </tbody>
            </table>

            {/* Transit Overview */}
            <div style={{ marginBottom: '15px' }}>
                <p style={{ margin: '0 0 5px 0' }}><strong>Transit ID:</strong> {data?.transitId || ''}</p>
            </div>

            {/* Table */}
            <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #000', marginBottom: '15px' }}>
              <thead>
                <tr style={{ backgroundColor: '#f2f2f2' }}>
                  <th style={{ border: '1px solid #000', padding: '6px', fontSize: '11px', textAlign: 'center' }}>S.No</th>
                  <th style={{ border: '1px solid #000', padding: '6px', fontSize: '11px', textAlign: 'center' }}>Bill ID</th>
                  <th style={{ border: '1px solid #000', padding: '6px', fontSize: '11px', textAlign: 'left' }}>Customer Name</th>
                  <th style={{ border: '1px solid #000', padding: '6px', fontSize: '11px', textAlign: 'center' }}>Type</th>
                  <th style={{ border: '1px solid #000', padding: '6px', fontSize: '11px', textAlign: 'center' }}>Physical/Released</th>
                  <th style={{ border: '1px solid #000', padding: '6px', fontSize: '11px', textAlign: 'center' }}>No. of Ornaments</th>
                  <th style={{ border: '1px solid #000', padding: '6px', fontSize: '11px', textAlign: 'center' }}>Gross Weight</th>
                  <th style={{ border: '1px solid #000', padding: '6px', fontSize: '11px', textAlign: 'center' }}>Net Weight</th>
                  <th style={{ border: '1px solid #000', padding: '6px', fontSize: '11px', textAlign: 'center' }}>Net Amount</th>
                  <th style={{ border: '1px solid #000', padding: '6px', fontSize: '11px', textAlign: 'center' }}>Bill Date</th>
                </tr>
              </thead>
              <tbody>
                {tableRows.map((row, index) => (
                  <tr key={index}>
                    <td style={{ border: '1px solid #000', padding: '6px', textAlign: 'center', fontSize: '11px' }}>{row.sno}</td>
                    <td style={{ border: '1px solid #000', padding: '6px', textAlign: 'center', fontSize: '11px' }}>{row.billId}</td>
                    <td style={{ border: '1px solid #000', padding: '6px', textAlign: 'left', fontSize: '11px' }}>{row.customerName}</td>
                    <td style={{ border: '1px solid #000', padding: '6px', textAlign: 'center', fontSize: '11px', textTransform: 'capitalize' }}>{row.type}</td>
                    <td style={{ border: '1px solid #000', padding: '6px', textAlign: 'center', fontSize: '11px', textTransform: 'capitalize' }}>{row.saleType}</td>
                    <td style={{ border: '1px solid #000', padding: '6px', textAlign: 'center', fontSize: '11px' }}>{row.numberOfOrnaments}</td>
                    <td style={{ border: '1px solid #000', padding: '6px', textAlign: 'center', fontSize: '11px' }}>{row.grossWeight.toFixed(3)}</td>
                    <td style={{ border: '1px solid #000', padding: '6px', textAlign: 'center', fontSize: '11px' }}>{row.netWeight.toFixed(3)}</td>
                    <td style={{ border: '1px solid #000', padding: '6px', textAlign: 'center', fontSize: '11px' }}>{Math.round(row.netAmount).toLocaleString('en-IN')}</td>
                    <td style={{ border: '1px solid #000', padding: '6px', textAlign: 'center', fontSize: '11px' }}>{row.billDate}</td>
                  </tr>
                ))}
                <tr style={{ fontWeight: 'bold', backgroundColor: '#f9f9f9' }}>
                  <td colSpan={5} style={{ border: '1px solid #000', padding: '6px', textAlign: 'right', fontSize: '11px' }}>Total</td>
                  <td style={{ border: '1px solid #000', padding: '6px', textAlign: 'center', fontSize: '11px' }}>{totalOrnaments}</td>
                  <td style={{ border: '1px solid #000', padding: '6px', textAlign: 'center', fontSize: '11px' }}>{totalGrossWeight.toFixed(3)}</td>
                  <td style={{ border: '1px solid #000', padding: '6px', textAlign: 'center', fontSize: '11px' }}>{totalNetWeight.toFixed(3)}</td>
                  <td style={{ border: '1px solid #000', padding: '6px', textAlign: 'center', fontSize: '11px' }}>{Math.round(totalNetAmount).toLocaleString('en-IN')}</td>
                  <td style={{ border: '1px solid #000', padding: '6px', textAlign: 'center', fontSize: '11px' }}></td>
                </tr>
              </tbody>
            </table>

            {/* Total Rows */}
            <div style={{ marginBottom: '40px' }}>
              <p style={{ margin: 0, fontWeight: 'bold' }}>Total Rows : {tableRows.length}</p>
            </div>

            {/* Signatures */}
            <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '60px' }}>
              <tbody>
                <tr>
                  <td style={{ width: '33.33%', verticalAlign: 'top', textAlign: 'left' }}>
                    <div style={{ marginBottom: '50px' }}>
                      <p style={{ margin: '0 0 4px 0', fontSize: '12px' }}>Transit Prepared by</p>
                      <p style={{ margin: 0, fontWeight: 'bold', fontSize: '13px' }}>
                        {preparerName} {preparerEmpId ? `(${preparerEmpId})` : ''}
                      </p>
                    </div>
                  </td>
                  <td style={{ width: '33.33%', verticalAlign: 'top', textAlign: 'center' }}>
                    <div style={{ marginBottom: '50px' }}>
                      <p style={{ margin: '0 0 4px 0', fontSize: '12px' }}>Transit Moved through</p>
                      <p style={{ margin: 0, fontWeight: 'bold', fontSize: '13px' }}>
                        {data?.transitMovedThrough || ''}
                      </p>
                    </div>
                  </td>
                  <td style={{ width: '33.33%', verticalAlign: 'top', textAlign: 'right' }}>
                    <div style={{ marginBottom: '50px' }}>
                      <p style={{ margin: '0 0 4px 0', fontSize: '12px' }}>Handled By</p>
                      <p style={{ margin: 0, fontWeight: 'bold', fontSize: '13px' }}>
                        {data?.deliveryBy || ''}
                      </p>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td style={{ width: '33.33%', verticalAlign: 'top', textAlign: 'left' }}>
                    <div>
                      <p style={{ margin: 0, fontSize: '12px', fontWeight: 'bold' }}>Branch Manager</p>
                    </div>
                  </td>
                  <td style={{ width: '33.33%', verticalAlign: 'top', textAlign: 'center' }}>
                    
                  </td>
                  <td style={{ width: '33.33%', verticalAlign: 'top', textAlign: 'right' }}>
                    <div>
                      <p style={{ margin: 0, fontSize: '12px', fontWeight: 'bold' }}>Handled by</p>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>

          </div>
        </Box>
      </DialogContent>
      <DialogActions sx={{ p: 3 }}>
        <Button onClick={onClose} variant="outlined">Close</Button>
        <Button onClick={handlePrint} variant="contained" startIcon={<Iconify icon="material-symbols:print" />}>
          Print
        </Button>
      </DialogActions>
    </Dialog>
  );
}

TransitPrint.propTypes = {
  id: PropTypes.string,
  open: PropTypes.bool,
  onClose: PropTypes.func,
};
