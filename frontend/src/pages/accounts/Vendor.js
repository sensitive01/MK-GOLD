import { Helmet } from 'react-helmet-async';
import Vendor from '../melting/Vendor';

export default function AccountsVendor() {
  return (
    <>
      <Helmet>
        <title> Vendor | Accounts </title>
      </Helmet>
      <Vendor />
    </>
  );
}
