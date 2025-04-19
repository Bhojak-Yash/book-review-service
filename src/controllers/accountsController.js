const message = require('../helpers/message');
const bcrypt = require('bcrypt');
const db = require('../models/db');
const accountsService = require('../services/accountsServices');

//Payable accounts
exports.getOrders = async (req, res) => {
    try {
        const { page = 1, limit = 10, status = '' } = req.query;
        const orderFrom = req.user?.id;

        const result = await accountsService.getOrders({
            orderFrom,
            page: parseInt(page),
            limit: parseInt(limit),
            status
        });

        res.status(200).json({
            success: true,
            message: "Orders fetched successfully",
            data: result
        });
    } catch (error) {
        console.error("getOrders controller error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch orders",
            error: error.message
        });
    }
};

exports.getTotalDueBalance = async (req, res) => {
    try {
        const orderFrom = req.user?.id; 

        const result = await accountsService.getTotalDueBalance(orderFrom);

        res.status(200).json({
            success: 200,
            data: result
        });
    } catch (error) {
        console.error("Error in getTotalDueBalance:", error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};

exports.getOverdueBalance = async (req, res) => {
    try {
        const orderFrom = req.user?.id;
        const {orderTo }= req.params;
        console.log("OrderFrom: ", orderFrom);
        console.log("OrderTo: ", orderTo);

        const result = await accountsService.getOverdueBalance( orderFrom, orderTo );

        res.status(200).json({
            success: true,
            data: result
        });
    } catch (error) {
        console.error("Error in getOverdueBalance controller:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch overdue balance",
            error: error.message
        });
    }
};




//Receivable accounts
exports.getOrdersReceived = async (req, res) => {
    try {
        const orderTo = req.user?.id;
        const { page = 1, limit = 10, status = '' } = req.query;

        const result = await accountsService.getOrdersReceived({
            orderTo,
            page: parseInt(page),
            limit: parseInt(limit),
            status
        });

        return res.status(200).json({
            success: true,
            message: "Orders received fetched successfully",
            data: result
        });
    } catch (error) {
        console.error("Error in getOrdersReceived:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch orders received",
            error: error.message
        });
    }
};

exports.getTotalDueBalanceGroupedByOrderFrom = async (req, res) => {
    try {
        const orderTo = req.user?.id;

        if (!orderTo || isNaN(orderTo)) {
            return res.status(400).json({
                success: false,
                message: "Invalid or missing orderTo from token"
            });
        }

        const result = await accountsService.getTotalDueBalanceGroupedByOrderFrom(orderTo);

        res.status(200).json({
            success: 200,
            data: result
        });
    } catch (error) {
        console.error("Error in getTotalDueBalanceGroupedByOrderFrom controller:", error);
        res.status(500).json({
            success: 500,
            message: "Failed to fetch grouped due balances",
            error: error.message
        });
    }
};

exports.getOverdueBalanceForUser = async (req, res) => {
    try {
        const orderFrom = parseInt(req.params.orderFrom);
        const orderTo = req.user?.id;

        if (!orderFrom || !orderTo) {
            return res.status(400).json({
                success: false,
                message: "Missing required orderFrom or user ID"
            });
        }

        const result = await accountsService.getOverdueBalanceForUser(orderFrom, orderTo);

        return res.status(200).json({
            success: 200,
            data: result
        });
    } catch (error) {
        console.error("Error in getOverdueBalanceForUser:", error);
        return res.status(500).json({
            success: 500,
            message: "Failed to fetch overdue balance",
            error: error.message
        });
    }
};
