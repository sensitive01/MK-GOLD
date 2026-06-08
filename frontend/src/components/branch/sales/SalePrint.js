import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { Button } from '@mui/material';
import { getSalesById } from '../../../apis/branch/sales';
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

  return (
    <>
      <iframe id="iframe" style={{ display: 'none', height: '0px', width: '0px', position: 'absolute' }} title="pdf" />
      <div id="pdf" style={{ color: 'white', backgroundColor: '#8A1B9F', padding: '20px' }}>
        <img
          alt="Logo"
          src="/newLogo.jpeg"
          style={{ width: '100px', display: 'block', margin: '20px auto', borderRadius: '50%' }}
        />
        <div style={{ display: 'block', textAlign: 'center', margin: '10px auto' }}>
          <span>
            MK Gold, {data?.branch?.branchName}, {data?.branch?.address?.city}
          </span>
          <br />
          <b>Ph:</b> 63661 11999
          <br />
          <b>GST:</b> {data?.branch?.gstNumber}
          <br />
          <div style={{ display: 'block', margin: '20px 0' }}>
            <table style={{ width: '100%', textAlign: 'left' }}>
              <tbody>
                <tr>
                  <td style={{ width: '50%' }}>
                    <b>Bill ID:</b> {data?.billId}
                  </td>
                  <td style={{ width: '50%', textAlign: 'right' }}>{data?.createdAt ? new Date(data?.createdAt).toDateString() : ''}</td>
                </tr>
                <tr>
                  <td style={{ width: '50%' }}>
                    <b>{data?.purchaseType?.toLowerCase() === 'gold' ? 'Gold' : 'Silver'} Rate:</b> &#8377;{' '}
                    {data?.purchaseType?.toLowerCase() === 'gold' ? data?.goldRate : data?.silverRate}
                  </td>
                  <td style={{ width: '50%', textAlign: 'right' }} />
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        <hr style={{ border: '0', borderBottom: '1px solid white' }} />
        <div style={{ margin: '20px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <table style={{ width: '75%', textAlign: 'left', borderCollapse: 'collapse' }}>
            <tbody>
              <tr>
                <th style={{ width: '40%' }}>Customer Name :</th>
                <td>{data?.customer?.name}</td>
              </tr>
              <tr>
                <th>Contact :</th>
                <td>{global.maskPhoneNumber(data?.customer?.phoneNumber)}</td>
              </tr>
              <tr>
                <th>Address :</th>
                <td>
                  {data?.customer?.address?.length > 0 
                    ? `${data?.customer?.address[0]?.address}, ${data?.customer?.address[0]?.city}, ${data?.customer?.address[0]?.state}, ${data?.customer?.address[0]?.pincode}`
                    : ''}
                </td>
              </tr>
            </tbody>
          </table>
          {data?.customer?.profileImage?.uploadedFile && (
            <div style={{ width: '80px', height: '80px', border: '1px solid white', borderRadius: '4px', overflow: 'hidden', marginLeft: '10px' }}>
              <img
                src={data.customer.profileImage.uploadedFile.startsWith('http') 
                  ? data.customer.profileImage.uploadedFile 
                  : `${global.baseURL}/${data.customer.profileImage.uploadedFile}`}
                alt="Customer"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </div>
          )}
        </div>
        <hr style={{ border: '0', borderBottom: '1px solid white' }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', margin: '20px 0' }}>
          {/* Left side: Ornaments Photos */}
          <div style={{ width: '45%' }}>
            {ornamentPhotos.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <b style={{ fontSize: '12px', display: 'block', marginBottom: '5px' }}>Ornaments Photo:</b>
                {ornamentPhotos.map((photo, index) => (
                  <div key={index} style={{ width: '100%', maxHeight: '180px', border: '1px solid white', borderRadius: '4px', overflow: 'hidden' }}>
                    <img
                      src={photo.startsWith('http') ? photo : `${global.baseURL}/${photo}`}
                      alt={`Ornaments ${index + 1}`}
                      style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ border: '1px dashed white', borderRadius: '4px', height: '120px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px' }}>
                No Ornaments Photo
              </div>
            )}
          </div>

          {/* Right side: Pricing Details */}
          <table style={{ width: '50%', textAlign: 'left', borderCollapse: 'collapse' }}>
            <tbody>
              <tr>
                <td style={{ width: '60%' }}>Total ornaments:</td>
                <td style={{ width: '40%', textAlign: 'right' }}>{data?.ornaments?.length || 0}</td>
              </tr>
              <tr>
                <td>Gross weight:</td>
                <td style={{ textAlign: 'right' }}>
                  {Math.round(data?.ornaments?.reduce((prev, cur) => (cur?.grossWeight || 0) + prev, 0) || 0)}
                </td>
              </tr>
              <tr>
                <td>Net weight:</td>
                <td style={{ textAlign: 'right' }}>
                  {Math.round(data?.ornaments?.reduce((prev, cur) => (cur?.netWeight || 0) + prev, 0) || 0)}
                </td>
              </tr>
              <tr>
                <td>Net Amount</td>
                <td style={{ textAlign: 'right' }}>&#8377; {Math.round(data?.netAmount || 0)}</td>
              </tr>
              <tr>
                <td>Release</td>
                <td style={{ textAlign: 'right' }}>
                  &#8377; {Math.round(data?.release?.reduce((prev, cur) => prev + (cur?.payableAmount || 0), 0) || 0)}
                </td>
              </tr>
              <tr>
                <td>Service Charges</td>
                <td style={{ textAlign: 'right' }}>
                  &#8377;{' '}
                  {Math.round(
                    (data?.netAmount || 0) -
                      (data?.payableAmount || 0) -
                      (data?.release?.reduce((prev, cur) => prev + (cur?.payableAmount || 0), 0) || 0)
                  )}
                </td>
              </tr>
              <tr>
                <th>Payable</th>
                <td style={{ textAlign: 'right', fontWeight: 'bold' }}>&#8377; {Math.round(data?.payableAmount || 0)}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div style={{ display: 'block', margin: '20px 0' }}>
          {data?.actionBy && (
            <div style={{ marginTop: '10px', fontSize: '12px' }}>
              <b>Approved By:</b> {data?.actionBy?.name} ({data?.actionBy?.employeeId})
            </div>
          )}
          {data?.actionAt && (
            <div style={{ marginTop: '5px', fontSize: '12px' }}>
              <b>Approved At:</b> {new Date(data?.actionAt).toLocaleString()}
            </div>
          )}
        </div>
        <hr style={{ border: '0', borderBottom: '1px solid white' }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', margin: '20px 0' }}>
          <div style={{ textAlign: 'start' }}>
            Thanks For your billing
            <br /> www.mk-gold.com
          </div>
          <div style={{ textAlign: 'center', width: '150px' }}>
            <div style={{ borderBottom: '1px solid white', height: '40px', marginBottom: '5px' }}></div>
            <span style={{ fontSize: '12px' }}>Customer Signature</span>
          </div>
        </div>
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
          }}
          startIcon={<Iconify icon={'material-symbols:print'} sx={{ mr: 2, color: 'primary.main' }} />}
          onClick={() => {
            const content = document.getElementById('pdf');
            const pri = document.getElementById('iframe').contentWindow;
            pri.document.open();
            pri.document.write(content.outerHTML);
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
