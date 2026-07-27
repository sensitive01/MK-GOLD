require('dotenv').config();
const mongoose = require('mongoose');
mongoose.connect(process.env.DB_HOST, { useNewUrlParser: true, useUnifiedTopology: true }).then(async () => {
  const db = mongoose.connection.db;
  const attendances = await db.collection('attendances').find({}).sort({ createdAt: -1 }).limit(10).toArray();
  console.log('LAST 10 ATTENDANCES:');
  attendances.forEach(a => {
    console.log('ID:', a._id, 'Date:', a.attendanceDate, 'Login:', a.loginTime);
    if (a.attendanceDate) {
        console.log('  Is Date?', a.attendanceDate instanceof Date);
        if (a.attendanceDate instanceof Date) {
            console.log('  Converted:', a.attendanceDate.toISOString());
        }
    }
  });
  process.exit(0);
}).catch(console.error);
