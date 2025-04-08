const message = require('../helpers/message');
const bcrypt = require('bcrypt');
const db = require('../models/db');
const Users = db.users;
const Distributors = db.distributors;
const empManagement_Service = require('../services/employeeManagement_Service');
const modulemappings = require('../models/modulemappings');


exports.create_role = async (req, res) => {
    try {
        const userIdFromToken = req.user.id;
        const data = req.body;

        const distributor = await empManagement_Service.create_role(data, userIdFromToken);

        return res.json(distributor);
    } catch (error) {
        console.error("create_role Error:", error.message);
        return res.status(500).json({ status: message.code500, message: error.message });
    }
};

exports.get_roles = async (req, res) => {
    try {
        const data = req.query;

        const roles = await empManagement_Service.get_roles(data);

        return res.json({ status: "success", message: "Roles fetched successfully", data: roles });
    } catch (error) {
        console.error("get_roles Error:", error.message);
        return res.status(500).json({ status: message.code500, message: error.message });
    }
};

exports.update_roles = async (req, res) => {
    try {
        const { id } = req.params;
        const data = req.body;

        if (!id) {
            return res.status(400).json({ status: "error", message: "Role ID is required." });
        }

        const roles = await empManagement_Service.update_roles(id, data);

        if (!roles) {
            return res.status(404).json({ status: "error", message: "Role not found." });
        }

        return res.json({ status: "success", message: "Role updated successfully", data: roles });
    } catch (error) {
        console.error("update_roles Error:", error.message);
        return res.status(500).json({ status: "error", message: error.message });
    }
};

exports.delete_role = async (req, res) => {
    try {
        const { id } = req.params;

        if (!id) {
            return res.status(400).json({ status: "error", message: "Role ID is required." });
        }

        const result = await empManagement_Service.delete_role(id);

        return res.json({ status: "success", message: "Data deleted successfully", data: result });
    } catch (error) {
        console.error("delete_roles Error:", error.message);
        return res.status(500).json({ status: "error", message: error.message });
    }
};

exports.createModule = async (req, res) => {
    try {
        const moduleData = req.body;
        const result = await empManagement_Service.createModuleConfig(moduleData);
        return res.status(201).json(result);
    } catch (error) {
        return res.status(500).json({ status: 500, message: error.message });
    }
};

exports.getModuleHierarchy = async (req, res) => {
    try {
        const moduleHierarchy = await empManagement_Service.getAllModules();
        return res.status(200).json({ status: 200, message: "Success", data: moduleHierarchy });
    } catch (error) {
        return res.status(500).json({ status: 500, message: error.message });
    }
};

exports.create_employee = async (req, res) => {
    try {
        const userIdFromToken = req.user;
        const data = req.body;
        const result = await empManagement_Service.create_employee(userIdFromToken, data);
        return res.status(201).json(result);
    } catch (error) {
        console.error("create_employee Error:", error.message);
        return res.status(500).json({ status: message.code500, message: error.message });
    }
};

exports.createModuleMappings = async (req, res) => {
    try {
        const { modules } = req.body;

        if (!Array.isArray(modules)) {
            return res.status(400).json({ message: 'Invalid data format: modules should be an array.' });
        }

        // Call the service function with the modules array
        const result = await empManagement_Service.createModuleMappings(modules);
        res.status(201).json(result);
    } catch (error) {
        res.status(500).json({
            message: 'An error occurred while inserting module mappings.',
            error: error.message,
        });
    }
};

exports.getRoleModuleMappings = async (req, res) => {
    try {
        const result = await empManagement_Service.getRoleModuleMappings();
        return res.status(201).json(result);
    } catch (error) {
        console.error("getRoleModuleMappings Error:", error.message);
        return res.status(500).json({ status: message.code500, message: error.message });
    }
};

exports.getAllEmployees = async (req, res) => {
    try {
        const userIdFromToken = req.user.id;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const search = req.query.search || '';

        const result = await empManagement_Service.getAllEmployees(userIdFromToken, page, limit, search);
        return res.status(201).json(result);
    } catch (error) {
        console.error("getAllEmployees Error:", error.message);
        return res.status(500).json({ status: message.code500, message: error.message });
    }
};

exports.updateEmployee = async (req, res) => {
    const employeeId = req.params.id;
    const userIdFromToken = req.user?.id;

    if (!userIdFromToken) {
        return res.status(401).json({ status: 401, message: "Unauthorized" });
    }

    const result = await empManagement_Service.updateEmployee(employeeId, req.body, userIdFromToken);
    return res.status(result.status).json(result);
};

exports.bulkUpdateEmployeeStatusController = async (req, res) => {
    try {
        const { employeeIds, status } = req.body;
        const userIdFromToken = req.user?.id;

        const result = await empManagement_Service.bulkUpdateEmployeeStatus(employeeIds, status, userIdFromToken);
        res.status(result.status).json(result);
    } catch (error) {
        console.error("❌ Error in bulkUpdateEmployeeStatusController:", error.message);
        res.status(500).json({ status: 500, message: "Internal Server Error" });
    }
};


exports.deleteEmployee = async (req, res) => {
    const employeeId = req.params.id;
    const userIdFromToken = req.user?.id;

    if (!userIdFromToken) {
        return res.status(401).json({ status: 401, message: "Unauthorized" });
    }

    const result = await empManagement_Service.deleteEmployeeById(employeeId, userIdFromToken);
    return res.status(result.status).json(result);
};

exports.getEmployeeStats = async (req, res) => {
    try {
        const userIdFromToken = req.user.id;
        const result = await empManagement_Service.getEmployeeStats(userIdFromToken);
        return res.status(200).json(result);
    } catch (error) {
        console.error("getEmployeeStats Error:", error.message);
        return res.status(500).json({ status: 500, message: error.message });
    }
};
