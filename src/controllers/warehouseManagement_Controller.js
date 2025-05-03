const message = require('../helpers/message');
const bcrypt = require('bcrypt');
const db = require('../models/db');
const Users = db.users;
const Distributors = db.distributors;
const warehouseService = require('../services/warehouseManagement_Service');
const modulemappings = require('../models/modulemappings');


exports.createWarehouse = async (req, res) => {
    try {
        const token = req.user; // token already extracted from middleware
        const data = req.body;  // expected: name, address, email, phone, ownerName, entityType

        const response = await warehouseService.createWarehouse(data, token);

        return res.status(response.status).json(response);
    } catch (error) {
        console.error("❌ Error in createWarehouse controller:", error.message);
        return res.status(500).json({
            status: 500,
            message: "Failed to create warehouse"
        });
    }
};

exports.getAllWarehouses = async (req, res) => {
    try {
        const { page = 1, limit = 10, search = '' } = req.query;

        const response = await warehouseService.getAllWarehouses(
            parseInt(page),
            parseInt(limit),
            search
        );

        res.status(response.status).json(response);
    } catch (error) {
        console.error("❌ Error in getAllWarehouses controller:", error.message);
        res.status(500).json({ status: 500, message: "Internal Server Error" });
    }
};

exports.updateWarehouseController = async (req, res) => {
    try {
        const { entityId } = req.params;
        const updatedData = req.body;

        const result = await warehouseService.updateWarehouse(entityId, updatedData);

        res.status(result.status).json({
            status: result.status,
            message: result.message,
            data: result.data || null
        });
    } catch (error) {
        console.error("❌ Error in updateWarehouse controller:", error.message);
        res.status(500).json({
            status: 500,
            message: "Internal Server Error"
        });
    }
};

exports.deleteWarehouse = async (req, res) => {
    try {
        const { entityId } = req.params;

        const result = await warehouseService.deleteWarehouse(entityId);

        res.status(result.status).json(result);
    } catch (error) {
        console.error("❌ Error in softDeleteWarehouseController:", error.message);
        res.status(500).json({ status: 500, message: "Internal Server Error" });
    }
};

exports.bulkUpdate = async (req, res) => {
    try {
        const { entityIds, status } = req.body;
        const userIdFromToken = req.user?.id;

        const result = await warehouseService.bulkUpdate(entityIds, status, userIdFromToken);
        res.status(result.status).json(result);
    } catch (error) {
        console.error("❌ Error in bulkUpdate Controller:", error.message);
        res.status(500).json({ status: 500, message: "Internal Server Error" });
    }
};

exports.getWarehouseStats = async (req, res) => {
    try {
        const userIdFromToken = req.user?.id;
        const result = await warehouseService.getWarehouseStats(userIdFromToken);
        res.status(result.status).json(result);
    } catch (error) {
        console.error("❌ Error in getWarehouseStatsController:", error.message);
        res.status(500).json({ status: 500, message: "Internal Server Error" });
    }
};

