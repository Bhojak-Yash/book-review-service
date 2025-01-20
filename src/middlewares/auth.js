const jwt = require('jsonwebtoken');
const dotenv = require('dotenv')
const db = require('../models/db')
const Logs = db.loginLogs
dotenv.config()

exports.generateToken = (user) => {
  const payload = { id: user.id, userName: user.userName,userType:user.userType }; 
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
      if(!check.dataValues){
        return res.status(401).json({ status:401,message: 'Invalid or expired token.' });
      }
       if(check.dataValues.isExpired){
        return res.status(401).json({ status:401,message: 'Invalid or expired token.' });
      }
      const decoded = jwt.verify(token, process.env.JWTKEY);
      
      req.user = decoded;
      console.log(req.user)
      next();
    } catch (error) {
      res.status(401).json({ status:401,message: 'Invalid or expired token.' });
    }
  }
  