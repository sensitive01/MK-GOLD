const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../backend/.env') });

const EmployeeSchema = new mongoose.Schema({
    name: String,
    email: String,
    phoneNumber: String
}, { strict: false });

const Employee = mongoose.model('employees', EmployeeSchema);

async function check() {
    await mongoose.connect(process.env.DB_HOST);
    const employees = await Employee.find({}).limit(5).exec();
    console.log(JSON.stringify(employees, null, 2));
    await mongoose.connection.close();
}

check();
