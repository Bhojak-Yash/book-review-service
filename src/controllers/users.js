const message = require('../helpers/message');
const bcrypt = require('bcrypt');
const db = require('../models/db');
const { generateToken } = require('../middlewares/auth')
const Users = db.users;
const Manufacturers = db.manufacturers;
const Distributors = db.distributors;
const Retailers = db.retailers;
const Employees = db.employees;
const Roles = db.roles;
const Logs = db.loginLogs
const crypto = require("crypto");
const nodemailer = require("nodemailer");

async function hashPassword(password) {
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    return hashedPassword;
}

const getData = async (userType, id) => {
    // console.log(userType,id)
    if (userType === 'Manufacturer') {
        return await Manufacturers.findOne({ where: { manufacturerId: Number(id) } })
    } else if (userType === 'Distributor') {
        return await Distributors.findOne({ where: { distributorId: Number(id) } })
    } else if (userType === 'Retailer') {
        return await Retailers.findOne({ where: { retailerId: Number(id) } })
    } else if (userType === 'Employee') {
        return await Employees.findOne({ where: { employeeId: Number(id) } })
    }
}

exports.createUsers = async (req, res) => {
    const transaction = await db.sequelize.transaction();
    try {
        const { userName, password, companyName, userType } = req.body;

        if (!userName || !password || !companyName || !userType) {
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
                status: "Active"
            },
            { transaction }
        );

        // Use the userId to create a entity entry

        if (userType === "Manufacturer") {
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
        else if (userType === "Distributor") {
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
        else if (userType === "Retailer") {
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
        else if (userType === "Employee") {
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
                    lastName: req.body.lastName,
                    employeeCode: "EMP" + user.id,
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


// exports.login = async(req,res)=>{
//     try {
//         const {userName,password,type} = req.body
//         // console.log(req.body)
//         if(!userName || !password || !type){
//            return res.json({
//                 status:message.code400,
//                 message:'Invalid input'
//             })
//         }
//         // let checkUser;
//         // if(type){
//             // console.log(';oooooooooo')
//         let checkUser = await Users.findOne({where:{userName:userName,userType:type}})
//         // console.log(checkUser)
//         // }
//         // else{
//         //     // console.log('--------------------')
//         //     checkUser = await Users.findOne({where:{userName:userName}})
//         // }
//         if(checkUser){
//             console.log(checkUser)
//             const match = await bcrypt.compare(password, checkUser.dataValues.password);
//             if(match){
//                 const data = await getData(checkUser.dataValues.userType,checkUser.dataValues.id)
//                 const tokenPayload={...checkUser.dataValues,"data":data?.dataValues}
//                 // console.log(tokenPayload)
//                 const token = await generateToken(tokenPayload)
//                 const loginlogs = await Logs.create({
//                     userId:checkUser.dataValues.id,
//                     token:token
//                 })
//                 // console.log(checkUser)
//                 checkUser.dataValues.loginId=loginlogs.id
//                 res.json({
//                     status:message.code200,
//                     message:message.message200,
//                     apiToken:token,
//                     loginId:loginlogs.id,
//                     apiData:checkUser.dataValues,
//                     data:data?.dataValues || null
//                 })
//             }else{
//                 res.json({
//                     status:message.code400,
//                     message:"wrong credentials"
//                 })
//             }
//         }else{
//             res.json({
//                 status:message.code400,
//                 message:"wrong credentials"
//             })
//         }
//     } catch (error) {
//         console.log('login error:',error.message)
//         res.json({
//             status:message.code500,
//             message:message.message500
//         })
//     }
// }
exports.login = async (req, res) => {
    try {
        let { userName, password, type } = req.body;

        userName = userName?.trim();
        // password = password?.trim();

        if (!userName || !password || !type) {
            return res.json({
                status: message.code400,
                message: 'Invalid input'
            });
        }
        let empOfType = null
        const checkUser = await db.users.findOne({
            where: { userName },
            include: [
                {
                    model: db.employees,
                    required: false
                }
            ]
        });

        if (!checkUser) {
            return res.json({
                status: message.code400,
                message: "Wrong credentials"
            });
        }
        
        if (checkUser.userType === 'Employee') {
            const employeeOf = checkUser.employee?.employeeOf;
            if (!employeeOf) {
                return res.json({
                    status: message.code400,
                    message: "employeeOf not found"
                });
            }
            
            const managerUser = await db.users.findOne({
                where: { id: employeeOf }
            });
            empOfType = managerUser?.dataValues?.userType
            console.log(employeeOf,empOfType,checkUser.userType)
            if(!managerUser){
                return res.json({
                status: message.code400,
                message: "Wrong credentials"
            });
            }
            if (managerUser.userType !== type) {
                return res.json({
                    status: message.code400,
                    message: `Access denied. Manager userType is not '${type}'`
                });
            }
        }else if(checkUser.userType !== type) {
            console.log('ppppp')
            return res.json({
                status: message.code400,
                message: "Wrong credentials"
            });
        }
        console.log('ppppppp[[[[[[[[[[[')
        const match = await bcrypt.compare(password, checkUser.password);
        if (!match) {
            return res.json({
                status: message.code400,
                message: "Wrong credentials"
            });
        }

        const data = await getData(checkUser.userType, checkUser.id);
        const tokenPayload = { ...checkUser.dataValues, empOfType: empOfType, data: data?.dataValues };

        const token = await generateToken(tokenPayload);

        const loginlogs = await Logs.create({
            userId: checkUser.id,
            token
        });

        checkUser.dataValues.loginId = loginlogs.id;

        const moduleMappingResponse = await getFullAccessInLogin(checkUser?.employee?.roleId, {
            userType: checkUser.userType,
            empOfType: empOfType,
            userId: checkUser.id
        });

        return res.json({
            status: message.code200,
            message: "Login Successful",
            apiToken: token,
            loginId: loginlogs.id,
            apiData: checkUser.dataValues,
            data: data?.dataValues || null,
            moduleMapping: moduleMappingResponse.data[0]
        });

    } catch (error) {
        console.log('login error:', error.message);
        res.json({
            status: message.code500,
            message: message.message500
        });
    }
};


exports.changePassword = async (req, res) => {
    try {
        const { currPassword, newPassword } = req.body
        const { userName } = req.user
        const checkUser = await Users.findOne({ where: { userName: userName } })
        if (checkUser) {
            const match = await bcrypt.compare(currPassword, checkUser.dataValues.password);
            if (match) {
                const hashedPassword = await hashPassword(newPassword)
                await Users.update({ password: hashedPassword, isPasswordChangeRequired: 0 }, { where: { userName: userName } })
                res.json({
                    status: message.code200,
                    message: 'Password changed successfully'
                })
            } else {
                res.json({
                    status: message.code400,
                    message: "wrong credentials"
                })
            }
        } else {
            res.json({
                status: message.code400,
                message: "wrong credentials"
            })
        }
    } catch (error) {
        console.log('changePassword error:', error.message)
        res.json({
            status: message.code500,
            message: message.message500,
        })
    }
}

exports.logout = async (req, res) => {
    try {
        // console.log(req.body)
        const { loginId } = req.body
        await Logs.update({ isExpired: true }, { where: { id: Number(loginId) } })
        res.json({
            status: message.code200,
            message: 'Successfully logout'
        })
    } catch (error) {
        console.log("logout error:", error.message)
        res.json({
            status: message.code500,
            message: message.message500,
            apiData: null
        })
    }
}

exports.forgotPassword = async (req, res) => {
    try {
        const { userName, type } = req.body;

        if (!userName || !type) {
            return res.status(400).json({ status: message.code400, message: "Username and type are required" });
        }
        // ✅ Check if user exists
        const user = await Users.findOne({
            where: { userName, userType: type },
            include: [
                {
                    model: db.employees,
                    required: false
                }
            ]
        });

        if (!user) {
            return res.status(404).json({ status: message.code400, message: "User not found" });
        }

        if (user.userType === 'Employee') {
            const employeeOf = user.employee?.employeeOf;

            if (!employeeOf) {
                return res.status(400).json({ status: message.code400, message: "employeeOf not found" });
            }

            const managerUser = await db.users.findOne({ where: { id: employeeOf } });

            if (!managerUser || managerUser.userType !== type) {
                return res.status(400).json({
                    status: message.code400,
                    message: `Access denied. Manager userType is not '${type}'`
                });
            }
        }

        const tempPassword = crypto.randomInt(100000, 999999).toString(); // 6-digit temp password
        const hashedPassword = await bcrypt.hash(tempPassword, 10); // Hash the temp password

        await Users.update(
            { password: hashedPassword, isPasswordChangeRequired: 1 },
            { where: { userName } }
        );

        // ✅ Send Temporary Password via Email
        await sendTemporaryPasswordEmail(user.userName, tempPassword);

        return res.status(200).json({
            status: message.code200,
            message: "Temporary password sent. Check your email.",
        });

    } catch (error) {
        console.error("Forgot Password Error:", error);
        return res.status(500).json({ status: message.code500, message: "Internal Server Error" });
    }
};

// ✅ Function to send Temporary Password via Email
async function sendTemporaryPasswordEmail(userName, tempPassword) {
    const transporter = nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 587,
        secure: false,
        auth: {
            user: process.env.EMAIL, // Your email
            pass: process.env.EMAIL_PASSWORD // Your email password or app password
        }
    });
    // console.log("......HHHHHHHHHHHHHHHHHHHHHHHHHHH...............")

    const mailOptions = {
        from: process.env.EMAIL,
        to: userName, // userName is an email in this case
        subject: "Your Temporary Password",
        text: `Your temporary password is: ${tempPassword}. Use this password to log in and reset your password.`
    };

    await transporter.sendMail(mailOptions);
}

async function getFullAccessInLogin(roleId, data) {
    try {
        let userType = data?.userType;
        if (userType === "Employee") {
            userType = data.empOfType;
        }

        console.log("Resolved userType:", userType);

        const moduleConfigs = await db.moduleconfigs.findAll({
            attributes: ['moduleConfigId', 'category', 'moduleName', 'menuType', 'parentMenuId', 'icon', 'url', 'moduleCategory'],
            raw: true
        });

        const filteredConfigs = moduleConfigs.filter(config => config.category === userType);

        const moduleMap = {};
        filteredConfigs.forEach(config => {
            moduleMap[config.moduleConfigId] = {
                ...config,
                accessLevel: null,
                moduleMappingId: null
            };
        });

        let roleName = null;
        if (roleId) {
            const role = await db.roles.findOne({
                where: { id: roleId },
                attributes: ['roleName'],
                raw: true
            });

            roleName = role?.roleName || null;
            console.log(roleName);

            const mappings = await db.modulemappings.findAll({
                where: {
                    roleId,
                    accessLevel: 'Full'
                },
                attributes: ['moduleMappingId', 'accessLevel', 'moduleConfigId'],
                raw: true
            });

            mappings.forEach(mapping => {
                if (moduleMap[mapping.moduleConfigId]) {
                    moduleMap[mapping.moduleConfigId].accessLevel = mapping.accessLevel;
                    moduleMap[mapping.moduleConfigId].moduleMappingId = mapping.moduleMappingId;
                }
            });
        }

        const moduleTree = [];
        const fullAccessModules = Object.values(moduleMap).filter(m => m.accessLevel === 'Full');

        fullAccessModules.forEach(module => {
            if (module.menuType === 'Main') {
                moduleTree.push({
                    moduleConfigId: module.moduleConfigId,
                    moduleMappingId: module.moduleMappingId,
                    moduleName: module.moduleName,
                    icon: module.icon,
                    url: module.url,
                    accessLevel: module.accessLevel,
                    subModules: []
                });
            }
        });

        fullAccessModules.forEach(module => {
            if (module.menuType === 'Sub') {
                const main = moduleTree.find(m => m.moduleConfigId === module.parentMenuId);
                if (main) {
                    main.subModules.push({
                        moduleConfigId: module.moduleConfigId,
                        moduleMappingId: module.moduleMappingId,
                        moduleName: module.moduleName,
                        icon: module.icon,
                        url: module.url,
                        accessLevel: module.accessLevel,
                        components: []
                    });
                }
            }
        });

        fullAccessModules.forEach(module => {
            if (module.menuType === 'Component') {
                moduleTree.forEach(main => {
                    main.subModules.forEach(sub => {
                        if (sub.moduleConfigId === module.parentMenuId) {
                            sub.components.push({
                                moduleConfigId: module.moduleConfigId,
                                moduleMappingId: module.moduleMappingId,
                                moduleName: module.moduleName,
                                icon: module.icon,
                                url: module.url,
                                accessLevel: module.accessLevel
                            });
                        }
                    });
                });
            }
        });

        return {
            status: 200,
            message: "Modules retrieved" + (roleId ? " with role mappings." : " with null access levels."),
            data: [{
                roleId: roleId || null,
                roleName: roleName || null,
                modules: moduleTree
            }]
        };
    } catch (error) {
        console.error("Error retrieving role-module mappings:", error);
        return {
            status: 500,
            message: "An error occurred while retrieving role-module mappings.",
            error: error.message
        };
    }
}