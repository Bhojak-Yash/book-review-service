const db = require('../models/db');
const Sequelize = require('sequelize');
const { Op, literal, fn, col } = require('sequelize');
const Order = db.orders;

//Payable accounts
exports.getOrders = async ({ orderFrom, page = 1, limit = 10 }) => {
    const offset = (page - 1) * limit;

    const whereClause = {
        orderFrom,
        balance: { [Op.gt]: 0 },
    };

    const { rows } = await Order.findAndCountAll({
        where: whereClause,
        offset,
        limit,
        order: [['createdAt', 'DESC']],
        include: [
            {
                model: db.manufacturers,
                as: 'manufacturer',
                attributes: ['companyName'],
                required: false,
            },
            {
                model: db.distributors,
                as: 'distributor',
                attributes: ['companyName'],
                required: false,
            },
            {
                model: db.retailers,
                as: 'retailer',
                attributes: ['firmName'],
                required: false,
            },
            {
                model: db.authorizations,
                as: 'authorization',
                attributes: ['creditCycle'],
                required: false,
                where: {
                    authorizedId: orderFrom,
                },
            },
        ],
    });

    const grouped = {};
    rows.forEach(order => {
        const creditCycle = order.authorization?.creditCycle || 0;
        const dueDate = new Date(order.orderDate);
        dueDate.setDate(dueDate.getDate() + creditCycle);
        const isOverdue = new Date() > dueDate;

        const key = `${order.orderFrom}-${order.orderTo}`;

        if (!grouped[key]) {
            const organisationName =
                order.manufacturer?.companyName ||
                order.distributor?.companyName ||
                order.retailer?.firmName ||
                null;

            grouped[key] = {
                orderFrom: order.orderFrom,
                orderTo: order.orderTo,
                organisationName,
                orderStatus: order.orderStatus,
                totalBalance: 0,
                totalOverdueBalance: 0,
            };
        }

        grouped[key].totalBalance += Number(order.balance);
        if (isOverdue) {
            grouped[key].totalOverdueBalance += Number(order.balance);
        }
    });

    const groupedOrders = Object.values(grouped);

    let totalBalanceSum = 0;
    let totalOverdueSum = 0;

    for (const order of groupedOrders) {
        totalBalanceSum += order.totalBalance;
        totalOverdueSum += order.totalOverdueBalance;
    }

    totalBalanceSum = Number(totalBalanceSum.toFixed(2));
    totalOverdueSum = Number(totalOverdueSum.toFixed(2));

    return {
        totalData: groupedOrders.length,
        currentPage: page,
        totalPages: 1,
        totalBalanceSum,
        totalOverdueSum,
        orders: groupedOrders,
    };
};

exports.getOrdersDetails = async ({ orderFrom, orderTo, page, limit }) => {
    const offset = (page - 1) * limit;

    const whereClause = {
        orderFrom,
        orderTo,
        balance: { [Op.gt]: 0 },
    };

    const { rows, count } = await Order.findAndCountAll({
        where: whereClause,
        offset,
        limit,
        order: [['createdAt', 'DESC']],
        include: [
            {
                model: db.manufacturers,
                as: 'manufacturer',
                attributes: ['companyName'],
                required: false,
            },
            {
                model: db.distributors,
                as: 'distributor',
                attributes: ['companyName'],
                required: false,
            },
            {
                model: db.retailers,
                as: 'retailer',
                attributes: ['firmName'],
                required: false,
            },
            {
                model: db.authorizations,
                as: 'authorization',
                attributes: ['creditCycle'],
                required: false,
                where: {
                    authorizedId: orderFrom,
                },
            },
        ],
    });

    let totalBalance = 0;
    let totalOverdueBalance = 0;

    const ordersWithOverdue = rows.map(order => {
        const orgName =
            order.manufacturer?.companyName ||
            order.distributor?.companyName ||
            order.retailer?.firmName ||
            null;

        const creditCycle = order.authorization?.creditCycle || 0;

        const dueDate = new Date(order.orderDate);
        dueDate.setDate(dueDate.getDate() + creditCycle);

        const now = new Date();
        const isOverdue = now > dueDate;
        const overdueBalance = isOverdue ? order.balance : 0;

        totalBalance += Number(order.balance);
        totalOverdueBalance += overdueBalance;

        return {
            OrderId: order.id,
            organisationName: orgName,
            invNo: order.invNo,
            balance: order.balance,
            overdueBalance,
            orderDate: order.orderDate,
            overDueDate: dueDate,
        };
    });

    totalBalance = Number(totalBalance.toFixed(2));
    totalOverdueBalance = Number(totalOverdueBalance.toFixed(2));

    return {
        totalData: count,
        currentPage: page,
        totalPages: Math.ceil(count / limit),
        totalBalance,
        totalOverdueBalance,
        orders: ordersWithOverdue,
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
exports.getOrdersReceived = async ({ orderTo, page = 1, limit = 10 }) => {
    try {
        const offset = (page - 1) * limit;

        const whereClause = {
            orderTo,
            balance: { [Op.gt]: 0 },
        };

        const { rows } = await Order.findAndCountAll({
            where: whereClause,
            offset,
            limit,
            order: [['createdAt', 'DESC']],
            include: [
                {
                    model: db.manufacturers,
                    as: 'fromManufacturer',
                    attributes: ['companyName'],
                    required: false,
                },
                {
                    model: db.distributors,
                    as: 'fromDistributor',
                    attributes: ['companyName'],
                    required: false,
                },
                {
                    model: db.retailers,
                    as: 'fromRetailer',
                    attributes: ['firmName'],
                    required: false,
                },
                {
                    model: db.authorizations,
                    as: 'authorization',
                    attributes: ['creditCycle'],
                    required: false,
                },
            ],
        });

        const grouped = {};
        rows.forEach(order => {
            const creditCycle = order.authorization?.creditCycle || 0;
            const dueDate = new Date(order.orderDate);
            dueDate.setDate(dueDate.getDate() + creditCycle);
            const isOverdue = new Date() > dueDate;

            const key = `${order.orderFrom}-${order.orderTo}`;

            const organisationName =
                order.fromManufacturer?.companyName ||
                order.fromDistributor?.companyName ||
                order.fromRetailer?.firmName ||
                null;

            if (!grouped[key]) {
                grouped[key] = {
                    orderTo: order.orderTo,
                    orderFrom: order.orderFrom,
                    organisationName,
                    orderStatus: order.orderStatus,
                    totalBalance: 0,
                    totalOverdueBalance: 0,
                };
            }

            grouped[key].totalBalance += Number(order.balance);
            if (isOverdue) {
                grouped[key].totalOverdueBalance += Number(order.balance);
            }
        });

        const groupedOrders = Object.values(grouped);

        let totalBalanceSum = 0;
        let totalOverdueSum = 0;

        groupedOrders.forEach(order => {
            totalBalanceSum += order.totalBalance;
            totalOverdueSum += order.totalOverdueBalance;
        });

        totalBalanceSum = Number(totalBalanceSum.toFixed(2));
        totalOverdueSum = Number(totalOverdueSum.toFixed(2));

        return {
                totalData: groupedOrders.length,
                currentPage: page,
                totalPages: 1,
                totalBalanceSum,
                totalOverdueSum,
                orders: groupedOrders.map(order => ({
                    ...order,
                    totalBalance: Number(order.totalBalance.toFixed(2)),
                    totalOverdueBalance: Number(order.totalOverdueBalance.toFixed(2)),
                })),
        };
    } catch (error) {
        console.error("Error fetching orders received:", error);
        throw error;
    }
};

exports.getOrdersDetailsReceived = async ({ orderTo, orderFrom, page = 1, limit = 10 }) => {
    const offset = (page - 1) * limit;

    const whereClause = {
        orderTo,
        ...(orderFrom && { orderFrom }),
        balance: { [Op.gt]: 0 },
    };

    const { rows, count } = await Order.findAndCountAll({
        where: whereClause,
        offset,
        limit,
        order: [['createdAt', 'DESC']],
        include: [
            {
                model: db.manufacturers,
                as: 'fromManufacturer',
                attributes: ['companyName'],
                required: false,
            },
            {
                model: db.distributors,
                as: 'fromDistributor',
                attributes: ['companyName'],
                required: false,
            },
            {
                model: db.retailers,
                as: 'fromRetailer',
                attributes: ['firmName'],
                required: false,
            },
            {
                model: db.authorizations,
                as: 'authorization',
                attributes: ['creditCycle'],
                required: false,
                where: {
                    authorizedId: orderFrom ?? 0,
                },
            },
        ],
    });

    let totalBalance = 0;
    let totalOverdueBalance = 0;

    const ordersWithOverdue = rows.map(order => {
        const orgName =
            order.fromManufacturer?.companyName ||
            order.fromDistributor?.companyName ||
            order.fromRetailer?.firmName ||
            null;

        const creditCycle = order.authorization?.creditCycle || 0;

        const dueDate = new Date(order.orderDate);
        dueDate.setDate(dueDate.getDate() + creditCycle);

        const now = new Date();
        const isOverdue = now > dueDate;
        const overdueBalance = isOverdue ? order.balance : 0;

        totalBalance += Number(order.balance);
        totalOverdueBalance += overdueBalance;

        return {
            OrderId: order.id,
            organisationName: orgName,
            invNo: order.invNo,
            balance: Number(order.balance.toFixed(2)), 
            overdueBalance: Number(overdueBalance.toFixed(2)),
            orderDate: order.orderDate,
            overDueDate: dueDate,
        };
    });

    totalBalance = Number(totalBalance.toFixed(2));
    totalOverdueBalance = Number(totalOverdueBalance.toFixed(2));

    return {
        totalData: count,
        currentPage: page,
        totalPages: Math.ceil(count / limit),
        totalBalance,
        totalOverdueBalance,
        orders: ordersWithOverdue,
    };
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