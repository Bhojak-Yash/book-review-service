const message = require('../helpers/message');
const db = require('../models/db');
const Sequelize = require('sequelize');
const { Op, literal, fn, col } = require('sequelize');
const Order = db.orders;

//Payable accounts
exports.getOrders = async ({ orderFrom, page, limit, status }) => {
    const offset = (page - 1) * limit;

    let whereClause = {
        orderFrom: orderFrom,
        balance: {
            [Op.gt]: 0
        }
    };

    if (status) {
        whereClause.orderStatus = {
            [Op.like]: `%${status}%`
        };
    }

    const { rows, count } = await Order.findAndCountAll({
        where: whereClause,
        offset,
        limit,
        order: [['createdAt', 'DESC']]
    });

    return {
        totalData: count,
        currentPage: page,
        totalPages: Math.ceil(count / limit),
        orders: rows
    };
};

exports.getTotalDueBalance = async (orderFrom) => {
    try {
        const result = await Order.findAll({
            attributes: [
                'orderFrom',
                [db.Sequelize.fn('SUM', db.Sequelize.col('balance')), 'total_due_balance']
            ],
            where: {
                orderFrom: orderFrom,
                balance: {
                    [Op.gt]: 0
                }
            },
            group: ['orderFrom']
        });

        if (result.length === 0) {
            return { orderFrom, total_due_balance: 0 };
        }

        // Sequelize returns an array of model instances, convert it to JSON
        return result[0].toJSON();

    } catch (error) {
        console.error("Error fetching total due balance:", error);
        throw error;
    }
};

exports.getOverdueBalance = async (orderFrom, orderTo) => {
    try {

        console.log("OrderFromsssss: ", orderFrom);
        console.log("OrderTosssssssssss: ", orderTo);

        const query = `
            SELECT 
                o.orderFrom, 
                o.orderTo, 
                SUM(o.balance) AS total_due_balance
            FROM orders o
            JOIN authorizations a 
                ON o.orderFrom = a.authorizedId AND o.orderTo = a.authorizedBy
            WHERE 
                o.orderFrom = :orderFrom 
                AND o.orderTo = :orderTo 
                AND o.balance > 0 
                AND NOW() > DATE_ADD(o.orderDate, INTERVAL a.creditCycle DAY)
            GROUP BY o.orderFrom, o.orderTo;
        `;

        const result = await db.sequelize.query(query, {
            replacements: {
                orderFrom: Number(orderFrom),
                orderTo: Number(orderTo)
            },
            type: Sequelize.QueryTypes.SELECT
        });

        if (result.length === 0) {
            return { orderFrom, orderTo, total_due_balance: 0 };
        }

        return result[0];
    } catch (error) {
        console.error("Error in getOverdueBalance service:", error.message);
        throw error;
    }
};




//Receivable accounts
exports.getOrdersReceived = async ({ orderTo, page = 1, limit = 10, status = '' }) => {
    try {
        const offset = (page - 1) * limit;

        const whereClause = {
            orderTo: orderTo
        };

        if (status) {
            whereClause.orderStatus = {
                [Op.like]: `%${status}%`
            };
        }

        const { rows, count } = await Order.findAndCountAll({
            where: whereClause,
            offset,
            limit,
            order: [['createdAt', 'DESC']]
        });

        return {
            totalData: count,
            currentPage: page,
            totalPages: Math.ceil(count / limit),
            orders: rows
        };
    } catch (error) {
        console.error("Error fetching orders received:", error);
        throw error;
    }
};

exports.getTotalDueBalanceGroupedByOrderFrom = async (orderTo) => {
    try {
        const query = `
            SELECT 
                orderFrom, 
                SUM(balance) AS total_due_balance
            FROM orders 
            WHERE 
                orderTo = :orderTo 
                AND balance > 0
            GROUP BY orderFrom;
        `;

        const result = await db.sequelize.query(query, {
            replacements: { orderTo: Number(orderTo) },
            type: db.Sequelize.QueryTypes.SELECT
        });

        return result;
    } catch (error) {
        console.error("Error in getTotalDueBalanceGroupedByOrderFrom service:", error);
        throw error;
    }
};


exports.getOverdueBalanceForUser = async (orderFrom, orderTo) => {
    try {
        const query = `
            SELECT 
                o.orderFrom, 
                o.orderTo, 
                SUM(o.balance) AS total_due_balance
            FROM orders o
            JOIN authorizations a 
                ON o.orderTo = a.authorizedBy AND o.orderFrom = a.authorizedId
            WHERE 
                o.orderFrom = :orderFrom 
                AND o.orderTo = :orderTo 
                AND o.balance > 0 
                AND NOW() > DATE_ADD(o.orderDate, INTERVAL a.creditCycle DAY)
            GROUP BY o.orderFrom, o.orderTo;
        `;

        const result = await db.sequelize.query(query, {
            replacements: { orderFrom: Number(orderFrom), orderTo: Number(orderTo) },
            type: db.Sequelize.QueryTypes.SELECT
        });

        if (result.length === 0) {
            return { orderFrom, orderTo, total_due_balance: 0 };
        }

        return result[0];
    } catch (error) {
        console.error("Error in getOverdueBalanceForUser service:", error);
        throw error;
    }
};

