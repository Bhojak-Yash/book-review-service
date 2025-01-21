const message = require('../helpers/message');
const bcrypt = require('bcrypt');
const db = require('../models/db');
const Users = db.users;
const Employees = db.employees;

async function hashPassword(password) {
  const saltRounds = 10;
  const hashedPassword = await bcrypt.hash(password, saltRounds);
  return hashedPassword;
}


exports.createEmployee = async (req,res) => {
  let transaction;
  try {
    const { userName, password, companyName,employeeOf,entityId } = req.body;
    console.log(req.body)
    if (!userName || !password || !companyName) {
      return res.json({
        status: message.code400,
        message: "All fields are required",
      });
    }

    if (!employeeOf || !entityId) {
        return res.json({
          status: message.code400,
          message: "Employee owner and entityId are mandatory",
        });
      }
    transaction = await db.sequelize.transaction();

    const hashedPassword = await hashPassword(password);

    const user = await Users.create(
      {
        userName: userName,
        password: hashedPassword,
        userType: 'Employee',
        status:"Active"
      },
      { transaction }
    );

    await Employees.create(
        {
            employeeId: user.id,
            firstName: req.body.firstName,
            lastName:  req.body.lastName,
            employeeCode: "EMP"+user.id,
            employeeOf: req.body.employeeOf,
            entityId:req.body.entityId,
            // divisionId: req.body.divisionId,
            // roleId: req.body.roleId,
            employeeStatus: "Active",
        },
        { transaction }
        );
       // Commit the transaction
      await transaction.commit();
      res.json({
        status: message.code200,
        message: message.message200,
      });
  } catch (error) {
    if (transaction) await transaction.rollback();
    console.log('createEmployee error:',error.message)
    res.json({
      status:message.code500,
      message:message.message500
    })
  }
}