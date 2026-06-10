import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { Button } from '@mui/material';
import moment from 'moment';
import { getSalesById } from '../../../apis/admin/sales';
import Iconify from '../../iconify';
import global from '../../../utils/global';

export default function SalePrint({ id }) {
  const [data, setData] = useState({});

  useEffect(() => {
    if (id) {
      getSalesById(id).then((data) => {
        setData(data.data);
      });
    }
  }, [id]);

  if (!data || Object.keys(data).length === 0) {
    return null;
  }

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

  const uniqueOrnamentPhotos = Array.from(new Set(ornamentPhotos));

  // Determine rows to display in the table
  const tableRows = [];
  if (data?.ornaments && data.ornaments.length > 0) {
    data.ornaments.forEach((orn) => {
      tableRows.push({
        name: orn.ornamentType || 'Ornament',
        grossWeight: orn.grossWeight || 0,
        stoneWeight: orn.stoneWeight || 0,
        netWeight: orn.netWeight || 0,
        purity: orn.purity || 0,
        value: orn.netAmount || 0,
      });
    });
  } else if (data?.release && data.release.length > 0) {
    data.release.forEach((rel) => {
      if (rel.ornaments && rel.ornaments.length > 0) {
        rel.ornaments.forEach((relOrn) => {
          tableRows.push({
            name: `${relOrn.ornamentType} (Release)`,
            grossWeight: relOrn.grossWeight || 0,
            stoneWeight: 0,
            netWeight: relOrn.netWeight || 0,
            purity: relOrn.purity || 0,
            value: 0,
          });
        });
      } else {
        tableRows.push({
          name: `Release Pledge (${rel.pledgeId} - ${rel.pledgedIn})`,
          grossWeight: rel.weight || 0,
          stoneWeight: 0,
          netWeight: rel.weight || 0,
          purity: 0,
          value: rel.payableAmount || 0,
        });
      }
    });
  }

  const totalGrossWeight = tableRows.reduce((sum, row) => sum + row.grossWeight, 0);
  const totalStoneWeight = tableRows.reduce((sum, row) => sum + row.stoneWeight, 0);
  const totalNetWeight = tableRows.reduce((sum, row) => sum + row.netWeight, 0);
  const totalValue = tableRows.reduce((sum, row) => sum + row.value, 0);

  // Valuation summary logic
  const netAmount = data?.netAmount || 0;
  const marginPercent = data?.margin || 0;
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

  return (
    <>
      <iframe id="iframe" style={{ display: 'none', height: '0px', width: '0px', position: 'absolute' }} title="pdf" />
      <div id="pdf" style={{ color: '#000', backgroundColor: '#fff', padding: '30px', fontFamily: 'Arial, sans-serif', fontSize: '13px', width: '750px', margin: '0 auto', boxSizing: 'border-box' }}>
        
        {/* Header Section */}
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px' }}>
          <tbody>
            <tr>
              <td style={{ verticalAlign: 'top', paddingBottom: '10px' }}>
                <h2 style={{ margin: 0, fontSize: '22px', fontWeight: 'bold' }}>PURCHASE INVOICE</h2>
              </td>
              <td style={{ textAlign: 'right', verticalAlign: 'top', paddingBottom: '10px' }}>
                <img
                  alt="Logo"
                  src="/newLogo.jpeg"
                  style={{ width: '90px', height: 'auto', objectFit: 'contain' }}
                  onError={(e) => { e.target.style.display = 'none'; }}
                />
              </td>
            </tr>
            <tr>
              <td style={{ verticalAlign: 'top', width: '60%', paddingTop: '10px' }}>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 'bold' }}>
                  MK Gold | {data?.branch?.branchName || ''}
                </h3>
                <p style={{ margin: '5px 0 0 0', fontSize: '12px', color: '#333' }}>
                  <strong>Address:</strong> {data?.branch?.address?.address || data?.branch?.address?.city || ''}
                </p>
                <p style={{ margin: '5px 0 0 0', fontSize: '12px', color: '#333' }}>
                  <strong>Phone:</strong> 63661 11999 &nbsp;&nbsp;&nbsp;&nbsp; <strong>GST:</strong> {data?.branch?.gstNumber || ''}
                </p>
              </td>
              <td style={{ textAlign: 'right', verticalAlign: 'top', width: '40%', paddingTop: '10px' }}>
                <p style={{ margin: 0, fontSize: '12px' }}>
                  <strong>Invoice No.:</strong> {data?.billId || ''}
                </p>
                <p style={{ margin: '5px 0 0 0', fontSize: '12px' }}>
                  <strong>Date & Time:</strong> {data?.createdAt ? moment(data?.createdAt).format('YYYY-MM-DD HH:mm:ss') : ''}
                </p>
              </td>
            </tr>
          </tbody>
        </table>

        {/* Customer Details & Customer Photo Section */}
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px' }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left', fontSize: '14px', paddingBottom: '6px', width: '72%' }}>Customer Details</th>
              <th style={{ textAlign: 'left', fontSize: '14px', paddingBottom: '6px', width: '28%', paddingLeft: '15px' }}>Customer Photo</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={{ verticalAlign: 'top' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #000' }}>
                  <tbody>
                    <tr>
                      <td style={{ border: '1px solid #000', padding: '6px 8px', fontWeight: 'bold', width: '30%', backgroundColor: '#f9f9f9' }}>Customer Name</td>
                      <td style={{ border: '1px solid #000', padding: '6px 8px' }}>{data?.customer?.name || ''}</td>
                    </tr>
                    <tr>
                      <td style={{ border: '1px solid #000', padding: '6px 8px', fontWeight: 'bold', backgroundColor: '#f9f9f9' }}>Mobile Number</td>
                      <td style={{ border: '1px solid #000', padding: '6px 8px' }}>{data?.customer?.phoneNumber ? global.maskPhoneNumber(data?.customer?.phoneNumber) : ''}</td>
                    </tr>
                    <tr>
                      <td style={{ border: '1px solid #000', padding: '6px 8px', fontWeight: 'bold', backgroundColor: '#f9f9f9' }}>Address</td>
                      <td style={{ border: '1px solid #000', padding: '6px 8px' }}>
                        {data?.customer?.address?.length > 0 
                          ? `${data?.customer?.address[0]?.address}, ${data?.customer?.address[0]?.city}, ${data?.customer?.address[0]?.state}, ${data?.customer?.address[0]?.pincode}`
                          : ''}
                      </td>
                    </tr>
                    <tr>
                      <td style={{ border: '1px solid #000', padding: '6px 8px', fontWeight: 'bold', backgroundColor: '#f9f9f9' }}>ID Proof Number</td>
                      <td style={{ border: '1px solid #000', padding: '6px 8px' }}>
                        {data?.customer?.idNo ? `${data?.customer?.chooseId || 'ID'}: ${data?.customer?.idNo}` : ''}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </td>
              <td style={{ verticalAlign: 'top', paddingLeft: '15px' }}>
                <div style={{ width: '100%', height: '116px', border: '1px solid #000', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fafafa', overflow: 'hidden' }}>
                  {data?.customer?.profileImage?.uploadedFile ? (
                    <img
                      src={data.customer.profileImage.uploadedFile.startsWith('http') 
                        ? data.customer.profileImage.uploadedFile 
                        : `${global.baseURL}/${data.customer.profileImage.uploadedFile}`}
                      alt="Customer"
                      style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                    />
                  ) : (
                    <span style={{ fontSize: '11px', color: '#999' }}>No Photo</span>
                  )}
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        {/* Ornament Details Section Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '6px' }}>
          <span style={{ fontSize: '14px', fontWeight: 'bold' }}>Ornament Details</span>
          <span style={{ fontSize: '12px', fontWeight: 'bold' }}>
            {data?.purchaseType?.toLowerCase() === 'gold' ? '24karat Gold Rate per Gram' : 'Silver Rate per Gram'}: &#8377; {data?.purchaseType?.toLowerCase() === 'gold' ? data?.goldRate?.toLocaleString('en-IN') : data?.silverRate?.toLocaleString('en-IN')}
          </span>
        </div>

        {/* Ornament Table */}
        <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #000', marginBottom: '20px' }}>
          <thead>
            <tr style={{ backgroundColor: '#FFD700' }}>
              <th style={{ border: '1px solid #000', padding: '6px', color: '#000', fontWeight: 'bold', width: '6%', textAlign: 'center' }}>Sno</th>
              <th style={{ border: '1px solid #000', padding: '6px', color: '#000', fontWeight: 'bold', width: '38%', textAlign: 'left' }}>Ornament(s)</th>
              <th style={{ border: '1px solid #000', padding: '6px', color: '#000', fontWeight: 'bold', width: '11%', textAlign: 'center' }}>Gross Wt</th>
              <th style={{ border: '1px solid #000', padding: '6px', color: '#000', fontWeight: 'bold', width: '12%', textAlign: 'center' }}>Stone / Wastage</th>
              <th style={{ border: '1px solid #000', padding: '6px', color: '#000', fontWeight: 'bold', width: '11%', textAlign: 'center' }}>Net Wt</th>
              <th style={{ border: '1px solid #000', padding: '6px', color: '#000', fontWeight: 'bold', width: '11%', textAlign: 'center' }}>Purity (%)</th>
              <th style={{ border: '1px solid #000', padding: '6px', color: '#000', fontWeight: 'bold', width: '11%', textAlign: 'right' }}>Value (₹)</th>
            </tr>
          </thead>
          <tbody>
            {tableRows.map((row, index) => (
              <tr key={index}>
                <td style={{ border: '1px solid #000', padding: '6px', textAlign: 'center' }}>{index + 1}</td>
                <td style={{ border: '1px solid #000', padding: '6px', textAlign: 'left' }}>{row.name}</td>
                <td style={{ border: '1px solid #000', padding: '6px', textAlign: 'center' }}>{row.grossWeight.toFixed(2)}</td>
                <td style={{ border: '1px solid #000', padding: '6px', textAlign: 'center' }}>{row.stoneWeight.toFixed(2)}</td>
                <td style={{ border: '1px solid #000', padding: '6px', textAlign: 'center' }}>{row.netWeight.toFixed(2)}</td>
                <td style={{ border: '1px solid #000', padding: '6px', textAlign: 'center' }}>{row.purity}%</td>
                <td style={{ border: '1px solid #000', padding: '6px', textAlign: 'right' }}>{Math.round(row.value).toLocaleString('en-IN')}</td>
              </tr>
            ))}
            {/* Grand Total Row */}
            <tr style={{ fontWeight: 'bold', backgroundColor: '#f9f9f9' }}>
              <td colSpan={2} style={{ border: '1px solid #000', padding: '6px', textAlign: 'right' }}>Grand Total =</td>
              <td style={{ border: '1px solid #000', padding: '6px', textAlign: 'center' }}>{totalGrossWeight.toFixed(2)}</td>
              <td style={{ border: '1px solid #000', padding: '6px', textAlign: 'center' }}>{totalStoneWeight.toFixed(2)}</td>
              <td style={{ border: '1px solid #000', padding: '6px', textAlign: 'center' }}>{totalNetWeight.toFixed(2)}</td>
              <td style={{ border: '1px solid #000', padding: '6px', textAlign: 'center' }}>-</td>
              <td style={{ border: '1px solid #000', padding: '6px', textAlign: 'right' }}>{Math.round(totalValue).toLocaleString('en-IN')}</td>
            </tr>
          </tbody>
        </table>

        {/* Ornament Photo & Valuation Summary Section */}
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px' }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left', fontSize: '14px', paddingBottom: '6px', width: '40%' }}>Ornament Photo</th>
              <th style={{ textAlign: 'left', fontSize: '14px', paddingBottom: '6px', width: '60%', paddingLeft: '15px' }}>Valuation Summary</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={{ verticalAlign: 'top' }}>
                <div style={{ width: '100%', height: '185px', border: '1px solid #000', display: 'flex', flexWrap: 'wrap', alignContent: 'center', justifyContent: 'center', backgroundColor: '#fafafa', overflow: 'hidden', padding: '4px', boxSizing: 'border-box', gap: '4px' }}>
                  {uniqueOrnamentPhotos.length > 0 ? (
                    uniqueOrnamentPhotos.map((photo, idx) => {
                      let imgWidth = '100%';
                      let imgHeight = '100%';
                      if (uniqueOrnamentPhotos.length === 2) {
                        imgWidth = '48%';
                      } else if (uniqueOrnamentPhotos.length >= 3) {
                        imgWidth = '48%';
                        imgHeight = '48%';
                      }
                      return (
                        <img
                          key={idx}
                          src={photo.startsWith('http') ? photo : `${global.baseURL}/${photo}`}
                          alt={`Ornament ${idx + 1}`}
                          style={{ width: imgWidth, height: imgHeight, objectFit: 'contain', border: '1px solid #ddd', backgroundColor: '#fff' }}
                        />
                      );
                    })
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', width: '100%' }}>
                      <span style={{ fontSize: '11px', color: '#999' }}>No Ornament Photo</span>
                    </div>
                  )}
                </div>
              </td>
              <td style={{ verticalAlign: 'top', paddingLeft: '15px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #000' }}>
                  <tbody>
                    <tr>
                      <td style={{ border: '1px solid #000', padding: '4px 6px', fontSize: '11px', color: '#444', verticalAlign: 'middle', width: '65%' }}>
                        (Service Charges are typically charges against Appraiser Charges, Payment Handling Charges, Release Handling Charges, Melting Charges, etc.) 
                        <strong style={{ display: 'block', color: '#000', fontSize: '12px', marginTop: '2px' }}>Service Charges ({serviceChargesPercent}%) =</strong>
                      </td>
                      <td style={{ border: '1px solid #000', padding: '4px 6px', textAlign: 'right', fontWeight: 'bold', fontSize: '13px', verticalAlign: 'bottom', width: '35%' }}>
                        &#8377; {serviceChargesAmount.toLocaleString('en-IN')}
                      </td>
                    </tr>
                    <tr>
                      <td style={{ border: '1px solid #000', padding: '6px', fontWeight: 'bold', fontSize: '12px' }}>CGST ({cgstPercent}%) =</td>
                      <td style={{ border: '1px solid #000', padding: '6px', textAlign: 'right', fontWeight: 'bold', fontSize: '13px' }}>
                        &#8377; {cgstAmount.toLocaleString('en-IN')}
                      </td>
                    </tr>
                    <tr>
                      <td style={{ border: '1px solid #000', padding: '6px', fontWeight: 'bold', fontSize: '12px' }}>SGST ({sgstPercent}%) =</td>
                      <td style={{ border: '1px solid #000', padding: '6px', textAlign: 'right', fontWeight: 'bold', fontSize: '13px' }}>
                        &#8377; {sgstAmount.toLocaleString('en-IN')}
                      </td>
                    </tr>
                    {data?.saleType === 'pledged' && (
                      <tr>
                        <td style={{ border: '1px solid #000', padding: '6px', fontWeight: 'bold', fontSize: '12px' }}>Release Charges =</td>
                        <td style={{ border: '1px solid #000', padding: '6px', textAlign: 'right', fontWeight: 'bold', fontSize: '13px' }}>
                          &#8377; {releaseChargesAmount.toLocaleString('en-IN')}
                        </td>
                      </tr>
                    )}
                    <tr style={{ backgroundColor: '#FFD700' }}>
                      <td style={{ border: '1px solid #000', padding: '8px 6px', fontWeight: 'bold', fontSize: '13px' }}>Payable Amount =</td>
                      <td style={{ border: '1px solid #000', padding: '8px 6px', textAlign: 'right', fontWeight: 'bold', fontSize: '15px' }}>
                        &#8377; {Math.abs(Math.round(data?.payableAmount || 0)).toLocaleString('en-IN')}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </td>
            </tr>
          </tbody>
        </table>

        {/* Terms & Conditions Section */}
        <div style={{ border: '1px solid #000', padding: '8px', marginBottom: '20px', boxSizing: 'border-box' }}>
          <strong style={{ display: 'block', fontSize: '12px', marginBottom: '4px' }}>Terms & Conditions:</strong>
          <ol style={{ margin: 0, paddingLeft: '18px', fontSize: '10px', lineHeight: '1.3', color: '#333' }}>
            <li>All gold/silver purchase transactions are final and binding.</li>
            <li>The valuation is calculated based on current market rates and gold/silver purity assessment.</li>
            <li>In case of release pledged transactions, bank release receipt must be provided for verification.</li>
            <li>Payment will be processed via approved banking channels or cash as per limits.</li>
          </ol>
        </div>

        {/* Customer Declaration Section */}
        <div style={{ marginBottom: '30px' }}>
          <strong style={{ display: 'block', fontSize: '12px', marginBottom: '4px' }}>Customer Declaration</strong>
          <p style={{ margin: 0, fontSize: '11px', lineHeight: '1.4', textAlign: 'justify', color: '#333' }}>
            I hereby declare that the ornaments sold by me are my lawful property and are free from any legal dispute, theft, pledge, or encumbrance. I voluntarily agree to sell the above-mentioned ornaments to MK Gold.
          </p>
        </div>

        {/* Signatures Section */}
        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px' }}>
          <tbody>
            <tr>
              <td style={{ width: '30%', textAlign: 'center', verticalAlign: 'bottom' }}>
                <div style={{ height: '50px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '4px' }}>
                  {data?.customer?.signatureImage?.uploadedFile ? (
                    <img
                      src={data.customer.signatureImage.uploadedFile.startsWith('http') 
                        ? data.customer.signatureImage.uploadedFile 
                        : `${global.baseURL}/${data.customer.signatureImage.uploadedFile}`}
                      alt="Customer Signature"
                      style={{ maxHeight: '50px', maxWidth: '160px', objectFit: 'contain' }}
                    />
                  ) : (
                    <div style={{ borderBottom: '1px solid #000', width: '80%', height: '100%' }}></div>
                  )}
                </div>
                <span style={{ fontSize: '11px', fontWeight: 'bold', display: 'block', borderTop: data?.customer?.signatureImage?.uploadedFile ? '1px solid #000' : 'none', width: '80%', margin: '0 auto', paddingTop: '4px' }}>
                  Customer Signature
                </span>
              </td>
              <td style={{ width: '40%', textAlign: 'center', fontSize: '11px', color: '#555', verticalAlign: 'bottom', paddingBottom: '4px' }}>
                Thanks For your billing
                <br />
                <a href="https://www.mk-gold.com" target="_blank" rel="noopener noreferrer" style={{ color: '#000', textDecoration: 'none', fontWeight: 'bold' }}>www.mk-gold.com</a>
              </td>
              <td style={{ width: '30%', textAlign: 'center', verticalAlign: 'bottom' }}>
                <div style={{ height: '50px', marginBottom: '4px' }}>
                  {data?.actionBy?.name ? (
                    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', height: '100%', paddingBottom: '4px' }}>
                      <span style={{ fontSize: '11px', fontStyle: 'italic' }}>{data.actionBy.name}</span>
                      <span style={{ fontSize: '9px', color: '#666' }}>({data.actionBy.employeeId})</span>
                    </div>
                  ) : (
                    <div style={{ borderBottom: '1px solid #000', width: '80%', height: '100%' }}></div>
                  )}
                </div>
                <span style={{ fontSize: '11px', fontWeight: 'bold', display: 'block', borderTop: '1px solid #000', width: '80%', margin: '0 auto', paddingTop: '4px' }}>
                  Authorized Signatory
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {(data?.status?.toLowerCase() === 'approved' || data?.status?.toLowerCase() === 'completed') && (
        <Button
          variant="contained"
          sx={{
            bgcolor: '#FFD700',
            color: 'primary.main',
            '&:hover': {
              bgcolor: '#FFD700',
            },
            mt: 2,
          }}
          startIcon={<Iconify icon={'material-symbols:print'} sx={{ mr: 2, color: 'primary.main' }} />}
          onClick={() => {
            const content = document.getElementById('pdf');
            const pri = document.getElementById('iframe').contentWindow;
            pri.document.open();
            pri.document.write('<html><head><meta charset="utf-8"><title>Print Bill</title></head><body style="margin:0;">' + content.outerHTML + '</body></html>');
            pri.document.close();
            pri.onload = () => {
              pri.focus();
              pri.print();
            };
          }}
        >
          Print
        </Button>
      )}
    </>
  );
}

SalePrint.propTypes = {
  id: PropTypes.string,
};
