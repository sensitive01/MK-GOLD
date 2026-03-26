import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { Button } from '@mui/material';
import { getSalesById } from '../../../apis/admin/sales';
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
        <hr style={{ border: '0', borderBottom: '1px solid white' }} />
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
        <div style={{ margin: '20px 0' }}>
          <table
            style={{
              width: '100%',
              textAlign: 'center',
              border: '1px solid white',
              borderCollapse: 'collapse',
            }}
          >
            <thead>
              <tr>
                <th
                  style={{
                    border: '1px solid white',
                    padding: '5px',
                  }}
                >
                  Gram
                </th>
                <th
                  style={{
                    border: '1px solid white',
                    padding: '5px',
                  }}
                >
                  Stone
                </th>
                <th
                  style={{
                    border: '1px solid white',
                    padding: '5px',
                  }}
                >
                  NetW
                </th>
                <th
                  style={{
                    border: '1px solid white',
                    padding: '5px',
                  }}
                >
                  Purity
                </th>
                <th
                  style={{
                    border: '1px solid white',
                    padding: '5px',
                  }}
                >
                  Amount
                </th>
              </tr>
            </thead>
            <tbody>
              {data?.ornaments?.map((e) => (
                <tr key={e._id}>
                  <td
                    style={{
                      border: '1px solid white',
                      padding: '5px',
                    }}
                  >
                    {e.grossWeight?.toFixed(2)} Gram
                  </td>
                  <td
                    style={{
                      border: '1px solid white',
                      padding: '5px',
                    }}
                  >
                    {e.stoneWeight?.toFixed(2)} Gram
                  </td>
                  <td
                    style={{
                      border: '1px solid white',
                      padding: '5px',
                    }}
                  >
                    {e.netWeight?.toFixed(2)} Gram
                  </td>
                  <td
                    style={{
                      border: '1px solid white',
                      padding: '5px',
                    }}
                  >
                    {e.purity} %
                  </td>
                  <td
                    style={{
                      border: '1px solid white',
                      padding: '5px',
                    }}
                  >
                    &#8377; {Math.round(e.netAmount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <hr style={{ border: '0', borderBottom: '1px solid white' }} />
        <div style={{ display: 'block', margin: '20px 0' }}>
          <table style={{ width: '100%', textAlign: 'left' }}>
            <tbody>
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
        <div style={{ display: 'block', margin: '20px 0' }}>
          {data.actionBy && (
            <div style={{ marginTop: '10px', fontSize: '12px' }}>
              <b>Approved By:</b> {data.actionBy.name} ({data.actionBy.employeeId})
            </div>
          )}
          {data.actionAt && (
            <div style={{ marginTop: '5px', fontSize: '12px' }}>
              <b>Approved At:</b> {new Date(data.actionAt).toLocaleString()}
            </div>
          )}
        </div>
        <hr style={{ border: '0', borderBottom: '1px solid white' }} />
        <div style={{ textAlign: 'center', margin: '20px 0' }}>
          Thanks For your billing
          <br /> www.mk-gold.com
        </div>
      </div>
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
    </>
  );
}

SalePrint.propTypes = {
  id: PropTypes.string,
};
