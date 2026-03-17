import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { Button } from '@mui/material';
import { getSalesById } from '../../../apis/branch/sales';
import Iconify from '../../iconify';

export default function SalePrint({ id }) {
  const [data, setData] = useState({});

  useEffect(() => {
    getSalesById(id).then((data) => {
      setData(data.data);
    });
  }, [id]);

  return (
    <>
      <iframe id="iframe" style={{ display: 'none', height: '0px', width: '0px', position: 'absolute' }} title="pdf" />
      <div id="pdf">
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
                  <td style={{ width: '50%', textAlign: 'right' }}>{new Date(data?.createdAt).toDateString()}</td>
                </tr>
                <tr>
                  <td style={{ width: '50%' }}>
                    <b>{data?.purchaseType?.toLowerCase() === 'gold' ? 'Gold' : 'Silver'} Rate:</b> &#8377;{' '}
                    {data?.purchaseType?.toLowerCase() === 'gold' ? data.goldRate : data.silverRate}
                  </td>
                  <td style={{ width: '50%', textAlign: 'right' }} />
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        <hr style={{ border: '0', borderBottom: '1px solid' }} />
        <div style={{ margin: '20px 0' }}>
          <table style={{ width: '100%', textAlign: 'left' }}>
            <tbody>
              <tr>
                <th style={{ width: '40%' }}>Customer Name :</th>
                <td>{data?.customer?.name}</td>
              </tr>
              <tr>
                <th>Contact :</th>
                <td>{data?.customer?.phoneNumber}</td>
              </tr>
              <tr>
                <th>Address :</th>
                <td>
                  {`${data?.customer?.address[0]?.address}, ${data?.customer?.address[0]?.city}, ${data?.customer?.address[0]?.state}, ${data?.customer?.address[0]?.pincode}`}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <hr style={{ border: '0', borderBottom: '1px solid' }} />
        <div style={{ display: 'block', margin: '20px 0' }}>
          <table style={{ width: '100%', textAlign: 'left' }}>
            <tbody>
              <tr>
                <td style={{ width: '50%' }}>Total ornaments:</td>
                <td style={{ width: '50%', textAlign: 'right' }}>{data?.ornaments?.length}</td>
              </tr>
              <tr>
                <td style={{ width: '50%' }}>Gross weight:</td>
                <td style={{ width: '50%', textAlign: 'right' }}>
                  {Math.round(data?.ornaments?.reduce((prev, cur) => cur.grossWeight + prev, 0))}
                </td>
              </tr>
              <tr>
                <td style={{ width: '50%' }}>Net weight:</td>
                <td style={{ width: '50%', textAlign: 'right' }}>
                  {Math.round(data?.ornaments?.reduce((prev, cur) => cur.netWeight + prev, 0))}
                </td>
              </tr>
              <tr>
                <td style={{ width: '50%' }}>Net Amount</td>
                <td style={{ width: '50%', textAlign: 'right' }}>&#8377; {Math.round(data?.netAmount)}</td>
              </tr>
              <tr>
                <td style={{ width: '50%' }}>Release</td>
                <td style={{ width: '50%', textAlign: 'right' }}>
                  &#8377; {Math.round(data?.release?.reduce((prev, cur) => prev + cur.payableAmount, 0))}
                </td>
              </tr>
              <tr>
                <td style={{ width: '50%' }}>Service Charges</td>
                <td style={{ width: '50%', textAlign: 'right' }}>
                  &#8377;{' '}
                  {Math.round(
                    data?.netAmount -
                      data?.payableAmount -
                      data?.release?.reduce((prev, cur) => prev + cur.payableAmount, 0)
                  )}
                </td>
              </tr>
              <tr>
                <th style={{ width: '50%' }}>Payable</th>
                <td style={{ width: '50%', textAlign: 'right' }}>&#8377; {Math.round(data?.payableAmount)}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <hr style={{ border: '0', borderBottom: '1px solid' }} />
        <div style={{ textAlign: 'start', margin: '20px 0' }}>
          Thanks For your billing
          <br /> www.mk-gold.com
        </div>
      </div>
      {data?.status?.toLowerCase() === 'approved' && (
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
            pri.document.write(content.innerHTML);
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
