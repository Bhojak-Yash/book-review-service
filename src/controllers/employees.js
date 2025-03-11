const message = require('../helpers/message');
const bcrypt = require('bcrypt');
const db = require('../models/db');
const Users = db.users;
const Employees = db.employees;
const EmployeeService = require('../services/employeeService');

async function hashPassword(password) {
  const saltRounds = 10;
  const hashedPassword = await bcrypt.hash(password, saltRounds);
  return hashedPassword;
}


exports.createEmployee = async (req,res) => {
  try {
    const data = req.body
    const Employee = await EmployeeService.createEmployee(data);

    // if (!distributor) {
      return res.json({ status:Employee.status,message:Employee.message, });
    // }

    // return res.status(200).json({ status:message.code200,message: "Distributer created successfully." });
  } catch (error) {
    console.error("Error fetching createDistributor:", error);
    return res.status(500).json({ status:message.code500,message: "Failed to create distributer", error: error.message });
  }
}