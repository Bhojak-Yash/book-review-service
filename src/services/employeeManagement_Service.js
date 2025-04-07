const message = require('../helpers/message');
const bcrypt = require('bcrypt');
const db = require('../models/db');
const Users = db.users;
const Distributors = db.distributors;
const Sequelize = require('sequelize');
const nodemailer = require('nodemailer');

    
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
            // Extract page, limit, and roleName from input data
            const { page = 1, limit, roleName } = data;
            // console.log(page,limit,';;;;;;;;;;;;;;;;;;;;;;;')
            // Default limit if not provided, and parse the page and limit values
            const Limit = Number(limit) || 10
            const Page = Number(page) || 1;
            const offset = (Page - 1) * Limit;

            // Initialize the filter condition
            let whereCondition = {};

            // Apply roleName filter if provided (case-insensitive search)
            if (roleName && roleName.trim() !== "") {
                whereCondition.roleName = { [db.Sequelize.Op.like]: `%${roleName}%` };
            }

            // Fetch roles with pagination, including the filter
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

            // Calculate total pages based on the count of roles and the limit per page
            const totalPages = Math.ceil(totalRoles / Limit);
            // console.log("Limit.......", Limit);
            // Return the paginated results along with metadata
            return {
                status: message.code200,
                message: message.message200,
                currentPage: Page,
                totalPages: totalPages,
                totalRoles: totalRoles,
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
                .replace(/\s+/g, "_");      // Replace spaces with underscores

            // Find role by ID
            const role = await db.roles.findOne({ where: { id } });

            if (!role) {
                return null; // Role not found
            }

            // Update the role with the new roleName and generated roleCode
            await db.roles.update(
                { roleName: newRoleName, roleCode: roleCode, status: status },
                { where: { id } }
            );

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

            // Attempt to delete the role with the specified roleId
            const deletedCount = await db.roles.destroy({
                where: { id: roleId }
            });

            if (deletedCount === 0) {
                throw new Error("Role not found.");
            }

        } catch (error) {
            console.error("Error deleting role:", error.message);
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
                status: 200,
                message: "Success",
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

    async create_employee(userIdFromToken, data) {
        let transaction;
        try {
            const { userName, phone, email, role, warehouse, entityId } = data;
            const employeeOf = userIdFromToken.id;

            console.log("tokenData:", employeeOf);

            // Validate required fields
            if (!userName || !phone || !email || !role || !warehouse || !entityId) {
                return {
                    status: message.code400,
                    message: "All fields are required",
                };
            }

            const nameParts = userName.trim().split(' ');
            const lastName = nameParts.pop();
            const firstName = nameParts.join(' ');

            transaction = await db.sequelize.transaction();

            const generatedPassword = Math.random().toString(36).slice(-8);
            const hashedPassword = await hashPassword(generatedPassword);

            const user = await Users.create(
                {
                    userName: email,
                    password: hashedPassword,
                    userType: 'Employee',
                    status: "Active",
                    email,
                    phone
                },
                { transaction }
            );

            // Create employee
            await db.employees.create(
                {
                    employeeId: user.id,
                    firstName,
                    lastName,
                    employeeCode: "EMP" + user.id,
                    employeeOf,
                    entityId,
                    email: email,
                    phone: phone,
                    role,
                    warehouse,
                    employeeStatus: "Active",
                },
                { transaction }
            );

            if (email) {
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
                    text: `Hello ${firstName},\n\nYour employee account has been created.\n\nUsername: ${userName}\nPassword: ${generatedPassword}\n\nPlease log in and change your password.`,
                };

                // Sending email inside try-catch block to avoid failure breaking transaction
                try {
                    await transporter.sendMail(mailOptions);
                    console.log("📧 Email sent successfully!");
                } catch (emailError) {
                    console.log("⚠️ Email sending failed:", emailError);
                    // throw new Error("User registration successful, but email could not be sent.");
                }
            }

            await transaction.commit();

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

}

module.exports = new DistributorService(db);
