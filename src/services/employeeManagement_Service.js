const message = require('../helpers/message');
const bcrypt = require('bcrypt');
const db = require('../models/db');
const Users = db.users;
const Distributors = db.distributors;
const Sequelize = require('sequelize');
const nodemailer = require('nodemailer');
const { Op } = require("sequelize");
const { delete_role } = require('../controllers/employeeManagement_Controller');

    
async function hashPassword(password) {
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    return hashedPassword;
}

class DistributorService {
    constructor(db) {
        this.db = db;
    }
    
    async create_role(data, userIdFromToken){
        try {
            if (!data.roleName) {
                throw new Error("roleName is required");
            }

            const roleCode = data.roleName.toUpperCase().replace(/\s+/g, "_");


            const existingRole = await db.roles.findOne({
                where: { roleCode: roleCode, ownerId: userIdFromToken }
            });

            if (existingRole) {
                throw new Error("Role already exists for this owner.");
            }

            const newRole = await db.roles.create({
                roleCode: roleCode,
                roleName: data.roleName,
                description: data.description || null,
                // priority: data.priority || 1, 
                status: data.status || "Active",
                ownerId: userIdFromToken,
            });

            return { status: "success", message: "Role created successfully", data: newRole };
        } catch (error) {
            console.error("Error creating role:", error.message);
            throw new Error(error.message);
        }
    }

    async get_roles(data) {
        try {
            const { page = 1, limit, roleName } = data;
            const Limit = Number(limit) || 10;
            const Page = Number(page) || 1;
            const offset = (Page - 1) * Limit;

            // Filter roles with deletedAt: null (i.e., not soft deleted)
            let whereCondition = {
                deletedAt: null,
            };

            // Filter by roleName if provided
            if (roleName && roleName.trim() !== "") {
                whereCondition.roleName = {
                    [db.Sequelize.Op.like]: `%${roleName}%`
                };
            }

            const { rows: roles, count: totalRoles } = await db.roles.findAndCountAll({
                where: whereCondition,
                attributes: [
                    'id',
                    'roleName',
                    'createdAt',
                    'status'
                ],
                order: [['createdAt', 'DESC']],
                limit: Limit,
                offset,
            });

            const totalPages = Math.ceil(totalRoles / Limit);

            return {
                status: message.code200,
                message: message.message200,
                currentPage: Page,
                totalPages,
                totalRoles,
                limit: Limit,
                apiData: roles
            };

        } catch (error) {
            console.error("Error fetching roles:", error.message);
            return {
                status: message.code500,
                message: message.message500
            };
        }
    }

    async update_roles(id, data) {
        try {
            const { newRoleName, status } = data;

            if (!newRoleName) {
                throw new Error("New role name is required.");
            }

            // Generate the roleCode by transforming the roleName:
            const roleCode = newRoleName
                .toUpperCase()              // Capitalize all characters
                .replace(/\s+/g, "_");      // Replace spaces with underscore


            // Update the role with the new roleName and generated roleCode
            const[updateCount] = await db.roles.update(
                { roleName: newRoleName, roleCode: roleCode, status: status },
                { where: { id } }
            );
            if (updateCount === 0) {
                throw new Error("Role not found.");
            }
            console.log("updateCount: ", updateCount);

            return { id, newRoleName, roleCode, status }; // Return updated role details

        } catch (error) {
            throw new Error(error.message);
        }
    }

    async delete_role(roleId) {
        try {
            if (!roleId) {
                throw new Error("roleId is required");
            }

            const [updatedCount] = await db.roles.update(
                { deletedAt: new Date() },
                { where: { id: roleId } }
            );
            if(!updatedCount){
                return {
                    status: 404,
                    message: "Employee not found or unauthorized"
                };
            }
            console.log("updateCount :", updatedCount);

            console.log(`Role with ID ${roleId} soft deleted`);

            return {
                status: 200,
                message: "Data deleted successfully",
            }
        } catch (error) {
            console.error("Error soft deleting role:", error.message);
            throw new Error(error.message);
        }
    }

    async addModuleConfig({ moduleName, category, icon, url, menuType, parentModuleName = null }) {
        try {
            // Generate moduleCode by converting moduleName to uppercase and replacing spaces with underscores
            const moduleCode = moduleName.toUpperCase().replace(/\s+/g, "_");

            let parentMenuId = null;

            // Determine parentMenuId based on menuType
            if (menuType === 'Sub' || menuType === 'Component') {
                if (!parentModuleName) {
                    throw new Error(`Parent module name is required for menuType '${menuType}'.`);
                }

                // Determine the expected parent menuType
                const expectedParentMenuType = menuType === 'Sub' ? 'Main' : 'Sub';

                // Find the parent module based on the provided parentModuleName and expected parent menuType
                const parentModule = await ModuleConfig.findOne({
                    where: {
                        moduleName: parentModuleName,
                        menuType: expectedParentMenuType
                    }
                });

                if (!parentModule) {
                    throw new Error(`Parent module '${parentModuleName}' with menuType '${expectedParentMenuType}' not found.`);
                }

                parentMenuId = parentModule.moduleConfigId;
            }

            // Create the new module configuration
            const newModule = await ModuleConfig.create({
                moduleName,
                moduleCode,
                category,
                icon,
                url,
                menuType,
                parentMenuId
            });

            return newModule;
        } catch (error) {
            console.error(`Error adding module: ${error.message}`);
            throw error;
        }
    }

    // async createModuleConfig(data){
    //     try {
    //         const { moduleName, category, icon, url, menuType } = data;

    //         // Convert moduleName to moduleCode (uppercase & replace spaces with '_')
    //         const moduleCode = moduleName.toUpperCase().replace(/\s+/g, "_");

    //         let parentMenuId = 0; // Default for 'Main'

    //         if (menuType === "Sub") {
    //             // Get the last inserted 'Main' module's ID
    //             const mainModule = await db.moduleconfigs.findOne({
    //                 where: { menuType: "Main" },
    //                 order: [["moduleConfigId", "DESC"]], // Get the latest Main module
    //             });

    //             if (mainModule) parentMenuId = mainModule.moduleConfigId;
    //         }
    //         else if (menuType === "Component") {
    //             // Get the last inserted 'Sub' module's ID
    //             const subModule = await db.moduleconfigs.findOne({
    //                 where: { menuType: "Sub" },
    //                 order: [["moduleConfigId", "DESC"]], // Get the latest Sub module
    //             });

    //             if (subModule) parentMenuId = subModule.moduleConfigId;
    //         }

    //         // Insert into moduleconfigs table
    //         const newModule = await db.moduleconfigs.create({
    //             moduleName,
    //             moduleCode,
    //             category,
    //             icon,
    //             url,
    //             menuType,
    //             parentMenuId,
    //         });

    //         return {
    //             status: 201,
    //             message: "Module created successfully",
    //             data: newModule,
    //         };
    //     } catch (error) {
    //         return {
    //             status: 500,
    //             message: error.message,
    //         };
    //     }
    // }

    async createModuleConfig(data) {
        try {
            const { moduleName, category, icon, url, menuType, parentMenuId } = data;

            // Convert moduleName to moduleCode (uppercase & replace spaces with '_')
            const moduleCode = moduleName.toUpperCase().replace(/\s+/g, "_");

            // Insert into moduleconfigs table
            const newModule = await db.moduleconfigs.create({
                moduleName,
                moduleCode,
                category,
                icon,
                url,
                menuType,
                parentMenuId, // now this comes from frontend
            });

            return {
                status: 201,
                message: "Module created successfully",
                data: newModule,
            };
        } catch (error) {
            return {
                status: 500,
                message: error.message,
            };
        }
    }

    // async getAllModules() {
    //     try {
    //         const modules = await db.moduleconfigs.findAll({ raw: true });

    //         // Organize modules into a nested structure
    //         const moduleTree = {};

    //         modules.forEach(module => {
    //             if (module.menuType === 'Main') {
    //                 moduleTree[module.moduleName] = { id: module.moduleConfigId, subModules: {} };
    //             }
    //         });

    //         modules.forEach(module => {
    //             if (module.menuType === 'Sub') {
    //                 const mainModule = Object.values(moduleTree).find(m => m.id === module.parentMenuId);
    //                 if (mainModule) {
    //                     mainModule.subModules[module.moduleName] = { id: module.moduleConfigId, components: [] };
    //                 }
    //             }
    //         });

    //         modules.forEach(module => {
    //             if (module.menuType === 'Component') {
    //                 Object.values(moduleTree).forEach(mainModule => {
    //                     Object.values(mainModule.subModules).forEach(subModule => {
    //                         if (subModule.id === module.parentMenuId) {
    //                             subModule.components.push({
    //                                 id: module.moduleConfigId,
    //                                 name: module.moduleName
    //                             });
    //                         }
    //                     });
    //                 });
    //             }
    //         });

    //         return moduleTree;
    //     } catch (error) {
    //         console.error("Error fetching module configurations:", error);
    //         throw error;
    //     }
    // }

    async getAllModules() {
        try {
            const modules = await db.moduleconfigs.findAll({ raw: true });

            // Organize modules into a nested structure
            const moduleTree = [];

            // Process Main Modules
            modules.forEach(module => {
                if (module.menuType === 'Main') {
                    moduleTree.push({
                        id: module.moduleConfigId,
                        name: module.moduleName,
                        subModules: []
                    });
                }
            });

            // Process Sub Modules
            modules.forEach(module => {
                if (module.menuType === 'Sub') {
                    const mainModule = moduleTree.find(m => m.id === module.parentMenuId);
                    if (mainModule) {
                        mainModule.subModules.push({
                            id: module.moduleConfigId,
                            name: module.moduleName,
                            components: []
                        });
                    }
                }
            });

            // Process Components
            modules.forEach(module => {
                if (module.menuType === 'Component') {
                    moduleTree.forEach(mainModule => {
                        mainModule.subModules.forEach(subModule => {
                            if (subModule.id === module.parentMenuId) {
                                subModule.components.push({
                                    id: module.moduleConfigId,
                                    name: module.moduleName
                                });
                            }
                        });
                    });
                }
            });

            return {
                // status: 200,
                // message: "Success",
                data: moduleTree
            };
        } catch (error) {
            console.error("Error fetching module configurations:", error);
            return {
                status: 500,
                message: "Error fetching module configurations",
                error: error.message
            };
        }
    }

    // async create_employee(userIdFromToken, data) {
    //     let transaction;
    //     try {
    //         const { userName, phone, email, roleId, entityId } = data;
    //         const employeeOf = userIdFromToken.id;

    //         console.log("tokenData:", data);

    //         // Validate required fields
    //         if (!userName || !phone || !email || !roleId || !entityId) {
    //             return {
    //                 status: message.code400,
    //                 message: "All fields are required",
    //             };
    //         }

    //         const nameParts = userName.trim().split(" ");
    //         let firstName = "";
    //         let lastName = "";

    //         if (nameParts.length === 1) {
    //             firstName = nameParts[0];
    //             lastName = "";
    //         } else {
    //             lastName = nameParts.pop();
    //             firstName = nameParts.join(" ");
    //         }


    //         transaction = await db.sequelize.transaction();

    //         const generatedPassword = Math.random().toString(36).slice(-8);
    //         const hashedPassword = await hashPassword(generatedPassword);

    //         const user = await Users.create(
    //             {
    //                 userName: email,
    //                 password: hashedPassword,
    //                 userType: 'Employee',
    //                 status: "Active",
    //                 email,
    //                 phone
    //             },
    //             { transaction }
    //         );

    //         // Create employee
    //         await db.employees.create(
    //             {
    //                 employeeId: user.id,
    //                 firstName,
    //                 lastName,
    //                 employeeCode: "EMP" + user.id,
    //                 employeeOf,
    //                 entityId,
    //                 email: email,
    //                 phone: phone,
    //                 roleId: roleId,
    //                 employeeStatus: "Active",
    //             },
    //             { transaction }
    //         );
    //         console.log(roleId);

    //         if (email) {
    //             const transporter = nodemailer.createTransport({
    //                 service: 'gmail',
    //                 auth: {
    //                     user: process.env.EMAIL,
    //                     pass: process.env.EMAIL_PASSWORD
    //                 }
    //             });

    //             const mailOptions = {
    //                 from: process.env.EMAIL_USER,
    //                 to: email,
    //                 subject: "Your Employee Account Password",
    //                 text: `Hello ${firstName},\n\nYour employee account has been created.\n\nUsername: ${email}\nPassword: ${generatedPassword}\n\nPlease log in and change your password.`,
    //             };

    //             // Sending email inside try-catch block to avoid failure breaking transaction
    //             try {
    //                 await transporter.sendMail(mailOptions);
    //                 console.log("📧 Email sent successfully!");
    //             } catch (emailError) {
    //                 console.log("⚠️ Email sending failed:", emailError);
    //                 // throw new Error("User registration successful, but email could not be sent.");
    //             }
    //         }

    //         await transaction.commit();

    //         return {
    //             status: message.code200,
    //             message: "Employee created successfully and password sent via email.",
    //         };

    //     } catch (error) {
    //         if (transaction) await transaction.rollback();
    //         console.log('createEmployee error:', error.message);
    //         return {
    //             status: message.code500,
    //             message: message.message500,
    //         };
    //     }
    // }

    async create_employee(userIdFromToken, data) {
        let transaction;
        try {
            const { userName, phone, email, roleId, entityId } = data;
            const employeeOf = userIdFromToken.id;

            const existingEmail = await db.users.findOne({
                where: { username: email }
            });
            if (existingEmail) {
                return {
                    status: 400,
                    message: "Email already exists"
                }
            }

            if (!userName || !phone || !email || !roleId || !entityId) {
                return {
                    status: message.code400,
                    message: "All fields are required",
                };
            }

            // Fast name split
            const [firstName, ...rest] = userName.trim().split(" ");
            const lastName = rest.join(" ");

            // Begin transaction
            transaction = await db.sequelize.transaction();

            // Generate and hash password
            const generatedPassword = Math.random().toString(36).slice(-8);
            const hashedPassword = await hashPassword(generatedPassword);

            // Create user
            const user = await Users.create({
                userName: email,
                password: hashedPassword,
                userType: 'Employee',
                status: "Active",
                email,
                phone
            }, { transaction });

            // Create employee
            await db.employees.create({
                employeeId: user.id,
                firstName,
                lastName,
                employeeCode: "EMP" + user.id,
                employeeOf,
                entityId,
                email,
                phone,
                roleId,
                employeeStatus: "Active",
            }, { transaction });

            // Commit transaction before sending email
            await transaction.commit();

            // Send email (outside transaction to save DB time)
            if (email) {
                sendEmployeeEmail(email, firstName, generatedPassword);
            }

            return {
                status: message.code200,
                message: "Employee created successfully and password sent via email.",
            };

        } catch (error) {
            if (transaction) await transaction.rollback();
            console.log('createEmployee error:', error.message);
            return {
                status: message.code500,
                message: message.message500,
            };
        }
    }

    async createModuleMappings(modules) {
        const transaction = await db.modulemappings.sequelize.transaction();
        try {
            // Perform bulk insert
            await db.modulemappings.bulkCreate(modules, { transaction });

            await transaction.commit();
            return { status: message.code200, message: 'Module mappings inserted successfully.' };
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    }

    // async getRoleModuleMappings() {
    //     try {
    //         // Fetch all roles
    //         const roles = await db.roles.findAll({
    //             attributes: ['id', 'roleName']
    //         });

    //         // Fetch all modules
    //         const modules = await db.moduleconfigs.findAll({
    //             attributes: ['moduleConfigId', 'moduleName']
    //         });

    //         // Initialize the role-module mapping array
    //         const roleModuleMappings = roles.map(role => ({
    //             roleId: role.id,
    //             roleName: role.roleName,
    //             modules: modules.map(module => ({
    //                 moduleConfigId: module.moduleConfigId,
    //                 moduleName: module.moduleName,
    //                 accessLevel: 'none' // Default access level
    //             }))
    //         }));

    //         return {
    //             status: 200,
    //             message: "Role-module mappings retrieved successfully.",
    //             data: roleModuleMappings
    //         };
    //     } catch (error) {
    //         console.error("Error retrieving role-module mappings:", error);
    //         return {
    //             status: 500,
    //             message: "An error occurred while retrieving role-module mappings.",
    //             error: error.message
    //         };
    //     }
    // }

    async getRoleModuleMappings(roleId) {
        try {
            const whereCondition = roleId ? { id: roleId } : {};

            // Fetch all roles with their associated module mappings and modules
            const roles = await db.roles.findAll({
                where: whereCondition,
                attributes: ['id', 'roleName'],
                include: [{
                    model: db.modulemappings,
                    attributes: ['accessLevel'],
                    include: [{
                        model: db.moduleconfigs,
                        attributes: ['moduleConfigId', 'moduleName', 'icon', 'url']
                    }]
                }]
            });

            // Transform the data into the desired format
            const roleModuleMappings = roles.map(role => ({
                roleId: role.id,
                roleName: role.roleName,
                modules: role.modulemappings.map(mapping => ({
                    moduleConfigId: mapping.moduleconfig.moduleConfigId,
                    moduleName: mapping.moduleconfig.moduleName,
                    icon: mapping.moduleconfig.icon,
                    url: mapping.moduleconfig.url,
                    accessLevel: mapping.accessLevel || 'none' // Default to 'none' if accessLevel is null
                }))
            }));

            return {
                status: 200,
                message: "Role-module mappings retrieved successfully.",
                data: roleModuleMappings
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
    
    async getAllEmployees(employeeOf, page = 1, limit = 10, search = '') {
        try {
            const offset = (page - 1) * limit;

            const whereClause = {
                employeeOf,
                deletedAt: null
            };

            if (search) {
                whereClause[Op.or] = [
                    { firstName: { [Op.like]: `%${search}%` } },
                    { lastName: { [Op.like]: `%${search}%` } }
                ];
            }

            const { count, rows: employees } = await db.employees.findAndCountAll({
                where: whereClause,
                include: [
                    {
                        model: db.roles,
                        as: 'role',
                        attributes: ['roleName']
                    }
                ],
                attributes: [
                    'employeeId',
                    'firstName',
                    'lastName',
                    'phone',
                    'email',
                    'employeeStatus',
                    'createdAt'
                ],
                order: [['createdAt', 'DESC']],
                limit,
                offset
            });

            const formattedEmployees = employees.map(emp => ({
                employeeId: emp.employeeId,
                employeeName: `${emp.firstName} ${emp.lastName}`.trim(),
                employeeRole: emp.role?.roleName || null,
                phone: emp.phone,
                email: emp.email,
                status: emp.employeeStatus
            }));

            return {
                status: 200,
                message: "Employees fetched successfully",
                data: {
                    employees: formattedEmployees,
                    pagination: {
                        total: count,
                        page,
                        limit,
                        totalPages: Math.ceil(count / limit)
                    }
                }
            };

        } catch (error) {
            console.error("❌ Service error - getAllEmployees:", error.message);
            return {
                status: 500,
                message: "Internal Server Error"
            };
        }
    }

    async updateEmployee(employeeId, data, userIdFromToken){
        try {
            
            const updates = {};
            if (data.employeeName) {
                const nameParts = data.employeeName.trim().split(" ");
                updates.lastName = nameParts.pop();
                updates.firstName = nameParts.join(" ");
            }

            if (data.phone) updates.phone = data.phone;
            if (data.email) updates.email = data.email;
            if (data.roleId) updates.roleId = data.roleId;
            if (data.status) updates.employeeStatus = data.status;

            const [updatedCount] = await db.employees.update(updates, {
                where: { employeeId, employeeOf: userIdFromToken },
            });

            if(!updatedCount){
                return {
                    status: 404,
                    message: "Employee not found or unauthorized"
                };
            }

            return {
                status: 200,
                message: "Employee updated successfully"
            };

        } catch (error) {
            console.error("❌ updateEmployeeById error:", error.message);
            return {
                status: 500,
                message: "Internal Server Error"
            };
        }
    }

    async bulkUpdateEmployeeStatus(employeeIds, status, userIdFromToken){
        try {
            // First, log the incoming data
            console.log("🔍 Input - IDs:", employeeIds, "Status:", status, "UserID:", userIdFromToken);

            const [updatedCount] = await db.employees.update(
                { employeeStatus: status },
                {
                    where: {
                        employeeId: employeeIds,
                        employeeOf: userIdFromToken,
                        deletedAt: null
                    }
                }
            );
            if (!updatedCount) {
                return {
                    status: 404,
                    message: "No matching employees found to update"
                };
            }
            console.log("updatedCount:", updatedCount);

            console.log("employeeId IN:", employeeIds);
            console.log("employeeOf:", userIdFromToken);
            console.log("deletedAt is NULL");


            return {
                status: 200,
                message: `Employee status updated to "${status}" successfully`,
                updatedCount
            };
        } catch (error) {
            console.error("❌ bulkUpdateEmployeeStatus error:", error.message);
            return {
                status: 500,
                message: "Internal Server Error"
            };
        }
    };

    async deleteEmployeeById(employeeId, userIdFromToken) {
        try {
            const [updatedCount] = await db.employees.update(
                { deletedAt: new Date() },
                { where: { employeeId } },
                { employeeOf: userIdFromToken },
            );

            if (!updatedCount) {
                return {
                    status: 404,
                    message: "Employee not found or unauthorized"
                };
            }
            // console.log("updatedCount : ", updatedCount);

            return {
                status: 200,
                message: "Employee marked as deleted"
            };

        } catch (error) {
            console.error("❌ deleteEmployeeById error:", error.message);
            return {
                status: 500,
                message: "Internal Server Error"
            };
        }
    }

    async getEmployeeStats(userIdFromToken) {
        try {
            const employeeOf = userIdFromToken;

            const totalEmployees = await db.employees.count({
                where: {
                    employeeOf,
                    deletedAt: null
                }
            });

            const totalRoles = await db.roles.count({
                where: {
                    deletedAt: null
                }
            });

            const inactiveEmployees = await db.employees.count({
                where: {
                    employeeOf,
                    employeeStatus: 'Inactive',
                    deletedAt: null
                }
            });

            const latestEmployee = await db.employees.findOne({
                where: {
                    employeeOf,
                    deletedAt: null
                },
                order: [['updatedAt', 'DESC']],
                attributes: ['updatedAt']
            });

            return {
                status: 200,
                message: "Employee statistics fetched successfully",
                data: {
                    totalEmployees,
                    totalRoles,
                    inactiveEmployees,
                    lastUpdatedAt: latestEmployee?.updatedAt || null
                }
            };

        } catch (error) {
            console.error("❌ Error - getEmployeeStats:", error.message);
            return {
                status: 500,
                message: "Internal Server Error"
            };
        }
    }
    
    async getEmployeeById(employeeId) {
        try {
            const employee = await db.employees.findOne({
                where: { employeeId },
                attributes: [
                    'employeeId',
                    'employeeCode',
                    'firstName',
                    'lastName',
                    'address',
                    'phone',
                    'email',
                    'employeeOf',
                    'entityId',
                    'createdAt',
                    'updatedAt',
                    'deletedAt',
                    'employeeStatus',
                    'roleId'
                ],
                raw: true,
            });

            return employee;
        } catch (error) {
            console.error("getEmployeeById Service Error:", error.message);
            throw error;
        }
    }
}

async function sendEmployeeEmail(email, name, password) {
    try {
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL,
                pass: process.env.EMAIL_PASSWORD
            }
        });

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: "Your Employee Account Password",
            text: `Hello ${name},\n\nYour employee account has been created.\n\nUsername: ${email}\nPassword: ${password}\n\nPlease log in and change your password.`,
        };

        await transporter.sendMail(mailOptions);
        console.log("📧 Email sent successfully!");
    } catch (emailError) {
        console.log("⚠️ Email sending failed:", emailError.message);
    }
}


module.exports = new DistributorService(db);