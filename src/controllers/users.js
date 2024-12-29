const message = require('../helpers/message');
const bcrypt = require('bcrypt');
const db = require('../models/db');
const {generateToken} = require('../middlewares/auth')
const Users = db.users;
const Manufacturers = db.manufacturers;
const Distributors = db.distributors;
const Retailers = db.retailers;
const Employees = db.employees;
const Roles = db.roles;
const Logs = db.loginLogs

async function hashPassword(password) {
  const saltRounds = 10;
  const hashedPassword = await bcrypt.hash(password, saltRounds);
  return hashedPassword;
}

exports.createUsers = async (req, res) => {
  const transaction = await db.sequelize.transaction();
  try {
    const { userName, password, companyName,userType } = req.body;

    if (!userName || !password || !companyName ||!userType) {
      return res.json({
        status: message.code400,
        message: "All fields are required",
      });
    }
    console.log(userType)
    const hashedPassword = await hashPassword(password);
  
    // Create the user and get the user ID
    const user = await Users.create(
      {
        userName: userName,
        password: hashedPassword,
        userType: userType,
        status:"Active"
      },
      { transaction }
    );

    // Use the userId to create a entity entry

    if(userType === "Manufacturer")
    {
        await Manufacturers.create(
        {
            manufacturerId: user.id, // Assuming `id` is the primary key of the `users` table
            companyName: companyName,
        },
        { transaction }
        );
         // Commit the transaction
        await transaction.commit();
    }
    else if(userType === "Distributor")
    {
        await Distributors.create(
            {
                distributorId: user.id, // Assuming `id` is the primary key of the `users` table
                companyName: companyName,
            },
            { transaction }
            );
             // Commit the transaction
            await transaction.commit();
    }
    else if (userType === "Retailer"){
        await Retailers.create(
            {
                retailerId: user.id, // Assuming `id` is the primary key of the `users` table
                firmName: companyName,
            },
            { transaction }
            );
             // Commit the transaction
            await transaction.commit();
    }
    else if (userType === "Employee"){
        if (!req.body.employeeOf || !req.body.divisionId) {
            return res.json({
              status: message.code400,
              message: "Employee owner and division are mandatory",
            });
          }
        await Employees.create(
            {
                employeeId: user.id, // Assuming `id` is the primary key of the `users` table
                firstName: req.body.firstName,
                lastName:  req.body.lastName,
                employeeCode: "EMP"+user.id,
                employeeOf: req.body.employeeOf,
                divisionId: req.body.divisionId,
                roleId: req.body.roleId,
                employeeStatus: "Active"
            },
            { transaction }
            );
             // Commit the transaction
            await transaction.commit();
    }


    res.json({
      status: message.code200,
      message: message.message200,
    });
  } catch (error) {
    // Rollback the transaction in case of an error
    if (transaction) await transaction.rollback();

    console.log("createUsers error:", error.message);
    res.json({
      status: message.code500,
      message: message.message500,
    });
  }
};


exports.login = async(req,res)=>{
    try {
        const {userName,password} = req.body
        let checkUser = await Users.findOne({where:{userName:userName}})
        if(checkUser){
            const match = await bcrypt.compare(password, checkUser.dataValues.password);
            if(match){
                const token = await generateToken(checkUser.dataValues)
                const loginlogs = await Logs.create({
                    userId:checkUser.dataValues.id,
                    token:token
                })
                checkUser.dataValues.loginId=loginlogs.id
                res.json({
                    status:message.code200,
                    message:message.message200,
                    apiToken:token,
                    apiData:checkUser.dataValues
                })
            }else{
                res.json({
                    status:message.code400,
                    message:"wrong credentials"
                })
            }
        }else{
            res.json({
                status:message.code400,
                message:"wrong credentials"
            })
        }
    } catch (error) {
        console.log('login error:',error.message)
        res.json({
            status:message.code500,
            message:message.message500
        })
    }
}

exports.changePassword = async(req,res) => {
    try {
        const {currPassword,newPassword} = req.body
        const {userName} =req.user
        const checkUser = await Users.findOne({where:{userName:userName}})
        if(checkUser){
            const match = await bcrypt.compare(currPassword, checkUser.dataValues.password);
            if(match){
                const hashedPassword =await hashPassword(newPassword)
                await Users.update({password:hashedPassword,isPasswordChangeRequired:0},{where:{userName:userName}})
                res.json({
                    status:message.code200,
                    message:'Password changed successfully'
                })
            }else{
                res.json({
                    status:message.code400,
                    message:"wrong credentials"
                })
            }
        }else{
            res.json({
                status:message.code400,
                message:"wrong credentials"
            })
        }
    } catch (error) {
        console.log('changePassword error:',error.message)
        res.json({
            status:message.code500,
            message:message.message500,
        })
    }
}

exports.logout = async(req,res) => {
    try {
        // console.log(req.body)
        const {loginId} =req.body
        await Logs.update({isExpired:true},{where:{id:Number(loginId)}})
        res.json({
            status:message.code200,
            message:'Successfully logout'
        })
    } catch (error) {
        console.log("logout error:",error.message)
        res.json({
            status:message.code500,
            message:message.message500,
            apiData:null
        })
    }
}