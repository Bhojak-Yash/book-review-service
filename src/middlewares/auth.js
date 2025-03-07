const jwt = require('jsonwebtoken');
const dotenv = require('dotenv')
const db = require('../models/db')
const Logs = db.loginLogs
const Employees = db.employees
const Users = db.users
dotenv.config()

exports.generateToken = (user) => {
  // console.log(user)
  const payload = { id: user.id, userName: user.userName,userType:user.userType,data:user?.data }; 
  const secretKey = process.env.JWTKEY;
  const options = { expiresIn: '30d' }; 

  const token = jwt.sign(payload, secretKey, options);
  return token;
};


exports.verifyToken = async(req, res, next) => {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) {
      return res.status(401).json({ status:401,message: 'Access denied. No token provided.' });
    }
  
    try {
      const check =await Logs.findOne({where:{token:token}})
      // console.log(check.dataValues)
      if(!check.dataValues){
        // console.log('1')
        return res.status(401).json({ status:401,message: 'Invalid or expired token.' });
      }
       if(check?.dataValues?.isExpired){
        // console.log('2')
        return res.status(401).json({ status:401,message: 'Invalid or expired token.' });
      }
      const decoded = jwt.verify(token, process.env.JWTKEY);
      req.user = decoded;
      // if(decoded && decoded?.userType && decoded?.userType === 'Employee'){
      //   const employee =await Employees.findOne({where:{employeeId:decoded.id}});
      //   const employeeOf = await Users.findOne({where:{id:employee.dataValues.employeeOf}})
      //   loggedInUserId = employee.dataValues.employeeOf;
      //   // console.log(employee,'l;l;l;',employeeOf)
      //   req.user.emp= {
      //     "employeeId":employee.dataValues?.employeeId ,
      //     "employeeOf": employee.dataValues?.employeeOf,
      //     "entityId": employee.dataValues?.entityId,
      //     "userType":"Employee"
      //   }
      //   req.user.empOf={
      //     "id":employeeOf.dataValues.id,
      //     "userType":employeeOf.dataValues.userType
      //   }
      // }
      next();
    } catch (error) {
      console.log('auth error',error.message)
      res.status(401).json({ status:401,message: 'Invalid or expired token.' });
    }
  }
  