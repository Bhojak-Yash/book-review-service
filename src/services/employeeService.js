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

class EmployeeService {
    constructor(db) {
        this.db = db;
    }

    async createEmployee(data) {
        let transaction;
        try {
          const { userName, password, companyName,employeeOf,entityId } = data;
          console.log(data)
          if (!userName || !password || !companyName) {
            return {
              status: message.code400,
              message: "All fields are required",
            }
          }
      
          if (!employeeOf || !entityId) {
              return {
                status: message.code400,
                message: "Employee owner and entityId are mandatory",
              }
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
                  firstName: data?.firstName,
                  lastName:  data?.lastName,
                  employeeCode: "EMP"+user.id,
                  employeeOf: data?.employeeOf,
                  entityId:data?.entityId,
                  // divisionId: req.body.divisionId,
                  // roleId: req.body.roleId,
                  employeeStatus: "Active",
              },
              { transaction }
              );
             // Commit the transaction
            await transaction.commit();
           return {
              status: message.code200,
              message: message.message200,
            }
        } catch (error) {
          if (transaction) await transaction.rollback();
          console.log('createEmployee error:',error.message)
          return {
            status:message.code500,
            message:message.message500
          }
        }

    }
}

module.exports = new EmployeeService(db);
