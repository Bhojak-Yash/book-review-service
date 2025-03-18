const message = require('../helpers/message');
const db = require('../models/db');
const { Op } = require('sequelize');

class distributorDashboard {
    constructor(db) {
        this.db = db;
    }

    async Statistics_one(tokenData) {
        try {
            let ownerId;

            if (tokenData.userType === 'Distributor') {
                ownerId = tokenData.data.distributorId;
            } else if (tokenData.userType === 'Employee') {
                const employeeRecord = await db.employees.findOne({ where: { employeeId: tokenData.id } });
                if (!employeeRecord) {
                    throw new Error('Employee not found');
                }
                ownerId = employeeRecord.employeeOf;
            } else {
                throw new Error('Invalid user type');
            }
            
            // console.log('..........................', ownerId);
            
            if (!db.stocks) {
                throw new Error('Stocks model is not loaded correctly');
            }
            
            const totalProducts = await db.stocks.count({ where: { organisationId: Number(ownerId) } });
            const retailersApproved = await db.authorizations.count({ where: {authorizedBy: Number(ownerId)}});
            const [orderReceivedResult, orderReceivedTodayResult] = await Promise.all([
                db.sequelize.query(
                    `SELECT COUNT(*) AS orderReceived
                    FROM orders
                    WHERE orderTo = :ownerId
                    AND createdAt >= DATE_SUB(NOW(), INTERVAL 30 DAY);`,
                    {
                        replacements: { ownerId: Number(ownerId) },
                        type: db.Sequelize.QueryTypes.SELECT,
                    }
                ),
                db.sequelize.query(
                    `SELECT COUNT(*) AS orderReceivedToday
                    FROM orders
                    WHERE orderTo = :ownerId
                    AND DATE(createdAt) = CURDATE();`,
                    {
                        replacements: { ownerId: Number(ownerId) },
                        type: db.Sequelize.QueryTypes.SELECT,
                    }
                )
            ]);

            const orderReceived = orderReceivedResult[0]?.orderReceived || 0;
            const orderReceivedToday = orderReceivedTodayResult[0]?.orderReceivedToday || 0;


            // console.log(";;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;", totalProducts );
            
            return {
                status: message.code200,
                message: message.message200,
                apiData: { orderReceived, totalProducts, retailersApproved, orderReceivedToday }
            };
        } catch (error) {
            console.error('Statistics_One service error:', error.message);
            return {
                status: message.code500,
                message: message.message500
            };
        }
    }

    async Statistics_two(tokenData, statusFilter = 'All') {
        try {
            let ownerId;

            if (tokenData.userType === 'Distributor') {
                ownerId = tokenData.data.distributorId;
            } else if (tokenData.userType === 'Employee') {
                const employeeRecord = await db.employees.findOne({ where: { employeeId: tokenData.id } });
                if (!employeeRecord) {
                    throw new Error('Employee not found');
                }
                ownerId = employeeRecord.employeeOf;
            } else {
                throw new Error('Invalid user type');
            }

            // Validate and apply the status filter
            const validStatuses = ['Pending', 'Approved', 'Rejected'];
            const statusCondition = statusFilter !== 'All' && validStatuses.includes(statusFilter)
                ? { status: statusFilter }
                : {};

            console.log('OwnerId:', ownerId);
            console.log('Status Filter Applied:', statusCondition);

            // Fetch authorized retailers with status filter
            const authorizedRetailers = await db.authorizations.findAll({
                where: { authorizedBy: Number(ownerId), ...statusCondition },
                attributes: ['authorizedId', 'status'],
            });

            if (!authorizedRetailers.length) {
                return {
                    status: message.code200,
                    message: 'No authorized retailers found',
                    apiData: { retailersApproved: [] },
                };
            }

            const authorizedIds = authorizedRetailers.map(item => item.authorizedId);

            // Fetch retailer details
            const retailerDetails = await db.retailers.findAll({
                where: { retailerId: authorizedIds },
                attributes: ['retailerId', 'firmName', 'phone'],
            });

            // Merge authorization -> retailer details
            const retailersApproved = authorizedRetailers.map(auth => {
                const retailer = retailerDetails.find(ret => ret.retailerId === auth.authorizedId);
                return {
                    retailerId: auth.authorizedId,
                    firmName: retailer ? retailer.firmName : null,
                    phone: retailer ? retailer.phone : null,
                    status: auth.status,
                };
            });

            return {
                status: message.code200,
                message: message.message200,
                apiData: { retailersApproved },
            };
        } catch (error) {
            console.error('Statistics_Two service error:', error.message);
            return {
                status: message.code500,
                message: message.message500,
            };
        }
    }

    //Stock running Low
    async Statistics_three(tokenData) {
        try {
            let ownerId;

            // Identify the ownerId based on userType
            if (tokenData.userType === 'Distributor') {
                ownerId = tokenData.data.distributorId;
            } else if (tokenData.userType === 'Employee') {
                const employeeRecord = await db.employees.findOne({ where: { employeeId: tokenData.id } });
                if (!employeeRecord) {
                    throw new Error('Employee not found');
                }
                ownerId = employeeRecord.employeeOf;
            } else {
                throw new Error('Invalid user type');
            }

            // Get low stock threshold from the environment (default to 10 if not set)
            const lowStockThreshold = process.env.aboutToEmpty || 10;

            // Fetch all PId and Stock where stock is less than the threshold
            const lowStockItems = await db.stocks.findAll({
                where: {
                    organisationId: Number(ownerId),
                    Stock: { [db.Sequelize.Op.lt]: Number(lowStockThreshold) },
                },
                attributes: ['PId', 'Stock'],
            });

            // Extract PId array from the low stock results
            const lowStockPIds = lowStockItems.map(item => item.PId);

            if (lowStockPIds.length === 0) {
                return {
                    status: message.code200,
                    message: 'No low-stock medicines found.',
                    apiData: [],
                };
            }

            // Fetch medicine names from the products table based on the low-stock PId values
            const productDetails = await db.products.findAll({
                where: { PId: lowStockPIds },
                attributes: ['PId', 'PName'],
            });

            // Map product details with corresponding stock Stock
            const lowStockMedicines = lowStockItems.map(stock => {
                const product = productDetails.find(prod => prod.PId === stock.PId);
                return {
                    PId: stock.PId,
                    PName: product ? product.PName : 'Unknown',
                    Stock: stock.Stock
                };
            });

            return {
                status: message.code200,
                message: message.message200,
                apiData: lowStockMedicines,
            };
        } catch (error) {
            console.error('Error in Statistics_three:', error.message);
            return {
                status: message.code500,
                message: message.message500,
            };
        }
    }

    // async Statistics_four(tokenData, filterType) {
    //     try {
    //         let ownerId;

    //         // Extracting the ownerId based on userType
    //         if (tokenData.userType === 'Distributor') {
    //             ownerId = tokenData.data.distributorId;
    //         } else if (tokenData.userType === 'Employee') {
    //             const employeeRecord = await db.employees.findOne({ where: { employeeId: tokenData.id } });
    //             if (!employeeRecord) {
    //                 throw new Error('Employee not found');
    //             }
    //             ownerId = employeeRecord.employeeOf;
    //         } else {
    //             throw new Error('Invalid user type');
    //         }

    //         // Validate filterType
    //         if (!['Revenue', 'Quantity'].includes(filterType)) {
    //             throw new Error('Invalid filter type. Use "Revenue" or "Quantity".');
    //         }

    //         let query;

    //         // Query for Revenue
    //         if (filterType === 'Revenue') {
    //             query = `
    //             SELECT p.PId, p.PName, SUM(oi.quantity * oi.price) AS total_revenue
    //             FROM orderitems oi
    //             JOIN products p ON oi.PId = p.PId
    //             JOIN orders o ON oi.orderId = o.id
    //             WHERE o.orderTo = :ownerId
    //             GROUP BY p.PId, p.PName
    //             ORDER BY total_revenue DESC;
    //         `;
    //         }
    //         // Query for Quantity in the last 6 months
    //         else if (filterType === 'Quantity') {
    //             query = `
    //             SELECT p.PId, p.PName, SUM(oi.quantity) AS total_quantity_sold
    //             FROM orderitems oi
    //             JOIN products p ON oi.PId = p.PId
    //             JOIN orders o ON oi.orderId = o.id
    //             WHERE o.orderTo = :ownerId
    //             AND o.createdAt >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
    //             GROUP BY p.PId, p.PName
    //             ORDER BY total_quantity_sold DESC;
    //         `;
    //         }

    //         // Execute the query with ownerId
    //         const results = await db.sequelize.query(query, {
    //             replacements: { ownerId },
    //             type: db.Sequelize.QueryTypes.SELECT
    //         });

    //         return {
    //             status: message.code200,
    //             message: message.message200,
    //             apiData: results
    //         };
    //     } catch (error) {
    //         console.error('Error in Statistics_four:', error.message);
    //         return {
    //             status: message.code500,
    //             message: message.message500
    //         };
    //     }
    // }

    async Statistics_four(tokenData, filterType) {
        try {
            let ownerId;

            // Determine ownerId from userType
            if (tokenData.userType === 'Distributor') {
                ownerId = tokenData.data.distributorId;
            } else if (tokenData.userType === 'Employee') {
                const employeeRecord = await db.employees.findOne({ where: { employeeId: tokenData.id } });
                if (!employeeRecord) {
                    throw new Error('Employee not found');
                }
                ownerId = employeeRecord.employeeOf;
            } else {
                throw new Error('Invalid user type');
            }

            // Validate filterType
            if (filterType !== 'Revenue' && filterType !== 'Quantity') {
                throw new Error('Invalid filter type. Use "Revenue" or "Quantity".');
            }

            // Define columns and calculation based on filterType
            const valueColumn = filterType === 'Revenue'
                ? 'SUM(oi.quantity * oi.price)'
                : 'SUM(oi.quantity)';

            const valueAlias = filterType === 'Revenue' ? 'total_revenue' : 'total_quantity_sold';

            // Query to calculate the total value (either Revenue or Quantity)
            const totalQuery = `
                SELECT ${valueColumn} AS total_value
                FROM orderitems oi
                JOIN orders o ON oi.orderId = o.id
                WHERE o.orderTo = :ownerId;
            `;

            // Fetch the total value (Revenue or Quantity) for this ownerId
            const totalResult = await db.sequelize.query(totalQuery, {
                type: db.Sequelize.QueryTypes.SELECT,
                replacements: { ownerId }
            });

            const totalValue = totalResult[0]?.total_value || 1; // Avoid division by zero

            // Main query to fetch product stats with percentage
            const query = `
                SELECT p.PId, p.PName, 
                    ${valueColumn} AS value,
                    ROUND((${valueColumn} / :totalValue) * 100,2) AS percentage
                FROM orderitems oi
                JOIN products p ON oi.PId = p.PId
                JOIN orders o ON oi.orderId = o.id
                WHERE o.orderTo = :ownerId
                GROUP BY p.PId, p.PName
                ORDER BY value DESC;
            `;

            // Execute the query
            const results = await db.sequelize.query(query, {
                type: db.Sequelize.QueryTypes.SELECT,
                replacements: { ownerId, totalValue }
            });

            return {
                status: message.code200,
                message: message.message200,
                apiData: results
            };
        } catch (error) {
            console.error('Error in Statistics_four:', error.message);
            return {
                status: message.code500,
                message: message.message500
            };
        }
    }

    async Statistics_five(tokenData) {
        try {
            let ownerId;

            if (tokenData.userType === 'Distributor') {
                ownerId = tokenData.data.distributorId;
            } else if (tokenData.userType === 'Employee') {
                const employeeRecord = await db.employees.findOne({ where: { employeeId: tokenData.id } });
                if (!employeeRecord) {
                    throw new Error('Employee not found');
                }
                ownerId = employeeRecord.employeeOf;
            } else {
                throw new Error('Invalid user type');
            }

            // console.log("Owner ID: ", ownerId);

            // SQL query to get top retailers by invAmt for a specific ownerId
            const query = `
            SELECT r.retailerId, r.firmName, SUM(o.invAmt) AS total_invAmt
            FROM orders o
            JOIN retailers r ON o.orderFrom = r.retailerId
            WHERE o.orderTo = :ownerId
            GROUP BY r.retailerId, r.firmName
            HAVING total_invAmt > 0
            ORDER BY total_invAmt DESC;
        `;

            const results = await db.sequelize.query(query, {
                type: db.Sequelize.QueryTypes.SELECT,
                replacements: { ownerId }
            });

            // console.log("Query results: ", results);

            return {
                status: message.code200,
                message: message.message200,
                apiData: results
            };
        } catch (error) {
            console.error('Error in Statistics_five:', error);
            return {
                status: message.code500,
                message: message.message500
            };
        }
    }

    async notifications(tokenData) {
        try {
            let ownerId;

            if (tokenData.userType === 'Distributor') {
                ownerId = tokenData.data.distributorId;
            } else if (tokenData.userType === 'Employee') {
                const employeeRecord = await db.employees.findOne({ where: { employeeId: tokenData.id } });
                if (!employeeRecord) {
                    throw new Error('Employee not found');
                }
                ownerId = employeeRecord.employeeOf;
            } else {
                throw new Error('Invalid user type');
            }

            // console.log('..........................', ownerId);

            if (!db.stocks) {
                throw new Error('Stocks model is not loaded correctly');
            }

            const [orderReceivedTodayResult] = await Promise.all([
                db.sequelize.query(
                    `SELECT COUNT(*) AS orderReceived
                    FROM orders
                    WHERE orderTo = :ownerId
                    AND createdAt >= DATE_SUB(NOW(), INTERVAL 30 DAY);`,
                    {
                        replacements: { ownerId: Number(ownerId) },
                        type: db.Sequelize.QueryTypes.SELECT,
                    }
                ),
                db.sequelize.query(
                    `SELECT COUNT(*) AS orderReceivedToday
                    FROM orders
                    WHERE orderTo = :ownerId
                    AND DATE(createdAt) = CURDATE();`,
                    {
                        replacements: { ownerId: Number(ownerId) },
                        type: db.Sequelize.QueryTypes.SELECT,
                    }
                )
            ]);
            const PO_Received = orderReceivedTodayResult[0]?.orderReceivedToday || 0;
            // console.log(";;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;", totalProducts ) 

            // Fetch count of pending authorization requests
            const RequestPending = await db.authorizations.count({
                where: db.sequelize.literal(`authorizedBy = ${ownerId} AND status = 'Pending'`)
            });


            // Get low stock threshold from the environment (default to 10 if not set)
            const lowStockThreshold = process.env.aboutToEmpty || 10;

            // Fetch the count of low-stock items
            const lowStockCount = await db.stocks.count({
                where: {
                    organisationId: Number(ownerId),
                    Stock: { [db.Sequelize.Op.lt]: Number(lowStockThreshold) }
                }
            });

            // console.log("Low Stock Count:", lowStockCount); // Debugging

            return {
                status: message.code200,
                message: message.message200,
                apiData: { PO_Received, RequestPending, lowStockCount }
            };      
        } catch (error) {
            console.error('Statistics_One service error:', error.message);
            return {
                status: message.code500,
                message: message.message500
            };
        }
    }
}

module.exports = new distributorDashboard(db);
