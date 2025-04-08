const message = require('../helpers/message');
const bcrypt = require('bcrypt');
const db = require('../models/db');
const Users = db.users;
const Distributors = db.distributors;
const Sequelize = require('sequelize');
const nodemailer = require('nodemailer');
const { Op, literal } = require("sequelize");


async function hashPassword(password) {
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    return hashedPassword;
}

exports.createWarehouse = async (data, token) => {
    try {
        const { name, address, entityType, email, phone, ownerName } = data;

        if (!entityType || typeof entityType !== 'string') {
            throw new Error("entityType is required and must be a string");
        }

        const entityCodePrefix = entityType.substring(0, 3).toUpperCase();

        const warehouse = await db.entities.create({
            name,
            address,
            status: "Active",
            organisationId: token.id,
            email,
            phone,
            ownerName,
            entityType
        });

        const entityCode = `${entityCodePrefix}-${warehouse.entityId}`;

        await warehouse.update({ entityCode });

        return {
            status: 200,
            message: "Warehouse created successfully",
            data: warehouse
        };
    } catch (error) {
        console.error("❌ Error in warehouseService:", error.message);
        throw new Error("Failed to create warehouse");
    }
};

exports.getAllWarehouses = async (page = 1, limit = 10, search = '') => {
    try {
        const offset = (page - 1) * limit;

        const whereClause = {
            deletedAt: null
        };

        if (search) {
            whereClause.name = {
                [Op.like]: `%${search}%`
            };
        }

        const { count, rows } = await db.entities.findAndCountAll({
            where: whereClause,
            attributes: [
                'entityId',
                'name',
                'address',
                'email',
                'phone',
                'status',
                'createdAt',
                'ownerName'  // ← directly from entities table now
            ],
            order: [['createdAt', 'DESC']],
            limit,
            offset
        });

        const formattedData = rows.map(row => ({
            entityId: row.entityId,
            name: row.name,
            address: row.address,
            email: row.email,
            phone: row.phone,
            status: row.status,
            createdAt: row.createdAt,
            ownerName: row.ownerName || null
        }));

        return {
            status: 200,
            message: "Warehouses fetched successfully",
            data: {
                warehouses: formattedData,
                pagination: {
                    total: count,
                    page,
                    limit,
                    totalPages: Math.ceil(count / limit)
                }
            }
        };
    } catch (error) {
        console.error("❌ Service error - getAllWarehouses:", error.message);
        return {
            status: 500,
            message: "Internal Server Error"
        };
    }
};

exports.updateWarehouse = async (entityId, data) => {
    try {
        const warehouse = await db.entities.findOne({
            where: {
                entityId,
                deletedAt: null
            }
        });

        if (!warehouse) {
            return {
                status: 404,
                message: "Warehouse not found"
            };
        }

        const updatableFields = ['name', 'address', 'phone', 'email', 'ownerName', 'entityType'];

        updatableFields.forEach(field => {
            if (data[field] !== undefined) {
                warehouse[field] = data[field];
            }
        });

        await warehouse.save();

        return {
            status: 200,
            message: "Warehouse updated successfully",
            data: {
                entityId: warehouse.entityId,
                name: warehouse.name,
                address: warehouse.address,
                email: warehouse.email,
                phone: warehouse.phone,
                status: warehouse.status,
                createdAt: warehouse.createdAt,
                ownerName: warehouse.ownerName
            }
        };
    } catch (error) {
        console.error("❌ Error in updateWarehouse:", error.message);
        return {
            status: 500,
            message: "Internal Server Error"
        };
    }
};

exports.deleteWarehouse = async (entityId) => {
    try {
        const warehouse = await db.entities.findOne({
            where: {
                entityId,
                deletedAt: null
            }
        });

        if (!warehouse) {
            return {
                status: 404,
                message: "Warehouse not found or already deleted"
            };
        }

        await db.entities.update(
            { deletedAt: new Date() },
            { where: { entityId } }
        );

        return {
            status: 200,
            message: "Warehouse deleted successfully"
        };
    } catch (error) {
        console.error("❌ Error in softDeleteWarehouse:", error.message);
        return {
            status: 500,
            message: "Internal Server Error"
        };
    }
};

exports.bulkUpdate = async (entityIds, status, userIdFromToken) => {
    try {
        // console.log("Input - Warehouse IDs:", entityIds, "Status:", status, "UserID:", userIdFromToken);

        const matchingWarehouses = await db.entities.findAll({
            where: {
                entityId: { [Op.in]: entityIds },
                organisationId: userIdFromToken,
                deletedAt: null
            }
        });

        // console.log("🔍 Matching warehouses found:", matchingWarehouses.length);

        if (matchingWarehouses.length === 0) {
            return {
                status: 404,
                message: "No matching warehouses found to update"
            };
        }

        const [updatedCount] = await db.entities.update(
            { status },
            {
                where: {
                    entityId: { [Op.in]: entityIds },
                    organisationId: userIdFromToken,
                    deletedAt: null
                }
            }
        );

        // console.log("Updated warehouse count:", updatedCount);

        return {
            status: 200,
            message: `Warehouse status updated to "${status}" successfully`,
            updatedCount
        };
    } catch (error) {
        console.error("❌ bulkUpdateWarehouseStatus error:", error.message);
        return {
            status: 500,
            message: "Internal Server Error"
        };
    }
};

exports.getWarehouseStats = async (userIdFromToken) => {
    try {
        // Total warehouses (excluding deleted)
        const totalWarehouses = await db.entities.count({
            where: {
                organisationId: userIdFromToken,
                deletedAt: null
            }
        });

        // Active warehouses
        const activeWarehouses = await db.entities.count({
            where: {
                organisationId: userIdFromToken,
                status: "Active",
                deletedAt: null
            }
        });

        // Inactive warehouses
        const inactiveWarehouses = await db.entities.count({
            where: {
                organisationId: userIdFromToken,
                status: "Inactive",
                deletedAt: null
            }
        });

        // Last updated warehouse (updatedAt)
        const latestUpdated = await db.entities.findOne({
            where: {
                organisationId: userIdFromToken,
                deletedAt: null
            },
            order: [["updatedAt", "DESC"]],
            attributes: ["updatedAt"]
        });

        return {
            status: 200,
            message: "Warehouse statistics fetched successfully",
            data: {
                totalWarehouses,
                activeWarehouses,
                inactiveWarehouses,
                lastUpdated: latestUpdated?.updatedAt || null
            }
        };

    } catch (error) {
        console.error("❌ Error in getWarehouseStats:", error.message);
        return {
            status: 500,
            message: "Internal Server Error"
        };
    }
};

