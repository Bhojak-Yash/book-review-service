const message = require('../helpers/message');
const db = require('../models/db');
const { Op, Sequelize } = require('sequelize');
const notificationsService = require('./notificationsService')

class distributorDashboard {
    constructor(db) {
        this.db = db;
    }

    // async distProductInfo(tokenData) {
    //     try {
    //         let ownerId = tokenData.id;
    //         if (tokenData.userType === 'Employee') {
    //             ownerId = tokenData.data.employeeOf;
    //         } else {
    //             throw new Error('Invalid user type');
    //         }

    //         // console.log('..........................', ownerId);

    //         if (!db.stocks) {
    //             throw new Error('Stocks model is not loaded correctly');
    //         }

    //         const [productStats, retailerStats, orderStats] = await Promise.all([
    //             db.stocks.findAll({
    //                 attributes: [
    //                     [db.Sequelize.fn('COUNT', db.Sequelize.col('productId')), 'totalProducts'],
    //                     'organisationId'
    //                 ],
    //                 where: { organisationId: Number(ownerId) },
    //                 group: ['organisationId'],
    //                 raw: true,
    //             }),
    //             db.authorizations.findAll({
    //                 attributes: [
    //                     [db.Sequelize.fn('COUNT', db.Sequelize.col('authorizedId')), 'retailersApproved'],
    //                     'authorizedBy'
    //                 ],
    //                 where: { authorizedBy: Number(ownerId) },
    //                 group: ['authorizedBy'],
    //                 raw: true,
    //             }),
    //             db.sequelize.query(
    //             `SELECT 
    //                 COUNT(*) AS orderReceived,
    //                 SUM(CASE WHEN DATE(createdAt) = CURDATE() THEN 1 ELSE 0 END) AS orderReceivedToday
    //                 FROM orders 
    //                 WHERE orderTo = :ownerId 
    //                 AND createdAt >= DATE_SUB(NOW(), INTERVAL 30 DAY)
    //                 GROUP BY orderTo;`,
    //                 {
    //                     replacements: { ownerId: Number(ownerId) },
    //                     type: db.Sequelize.QueryTypes.SELECT,
    //                 }
    //             )
    //         ]);

    //         // Extract results
    //         const totalProducts = productStats.length ? productStats[0].totalProducts : 0;
    //         const retailersApproved = retailerStats.length ? retailerStats[0].retailersApproved : 0;
    //         const orderReceived = orderStats.length ? orderStats[0].orderReceived : 0;
    //         const orderReceivedToday = orderStats.length ? orderStats[0].orderReceivedToday : 0;

    //         return {
    //             status: message.code200,
    //             message: message.message200,
    //             apiData: { orderReceived, totalProducts, retailersApproved, orderReceivedToday }
    //         };
    //     } catch (error) {
    //         console.error('Statistics_One service error:', error.message);
    //         return {
    //             status: message.code500,
    //             message: message.message500
    //         };
    //     }
    // }

    // async distributorRequest(tokenData, statusFilter = 'All') {
    //     try {
    //         let ownerId;

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

    //         // Validate and apply the status filter
    //         const validStatuses = ['Pending', 'Approved', 'Rejected'];
    //         const statusCondition = statusFilter !== 'All' && validStatuses.includes(statusFilter)
    //             ? { status: statusFilter }
    //             : {};

    //         console.log('OwnerId:', ownerId);
    //         console.log('Status Filter Applied:', statusCondition);

    //         // Fetch authorized retailers with status filter
    //         const authorizedRetailers = await db.authorizations.findAll({
    //             where: { authorizedBy: Number(ownerId), ...statusCondition },
    //             attributes: ['authorizedId', 'status'],
    //         });

    //         if (!authorizedRetailers.length) {
    //             return {
    //                 status: message.code200,
    //                 message: 'No authorized retailers found',
    //                 apiData: { retailersApproved: [] },
    //             };
    //         }

    //         const authorizedIds = authorizedRetailers.map(item => item.authorizedId);

    //         // Fetch retailer details
    //         const retailerDetails = await db.retailers.findAll({
    //             where: { retailerId: authorizedIds },
    //             attributes: ['retailerId', 'firmName', 'phone'],
    //         });

    //         // Merge authorization -> retailer details
    //         const retailersApproved = authorizedRetailers.map(auth => {
    //             const retailer = retailerDetails.find(ret => ret.retailerId === auth.authorizedId);
    //             return {
    //                 retailerId: auth.authorizedId,
    //                 firmName: retailer ? retailer.firmName : null,
    //                 phone: retailer ? retailer.phone : null,
    //                 status: auth.status,
    //             };
    //         });

    //         return {
    //             status: message.code200,
    //             message: message.message200,
    //             apiData: { retailersApproved },
    //         };
    //     } catch (error) {
    //         console.error('Statistics_Two service error:', error.message);
    //         return {
    //             status: message.code500,
    //             message: message.message500,
    //         };
    //     }
    // }
    async distProductInfo(tokenData) {
        try {
            let ownerId = tokenData.id;
            let checkUserType = tokenData.userType;
            console.log(tokenData, "..............................................");
            if (tokenData?.userType === 'Employee') {
                ownerId = tokenData.data.employeeOf;
                checkUserType = tokenData.empOfType;
            }
            if (!db.stocks) {
                throw new Error('Stocks model is not loaded correctly');
            }

            if (checkUserType === "Retailer") {

                const endDate = new Date();
                const startDate = new Date();
                startDate.setDate(endDate.getDate() - 30);

                const Op = db.Sequelize.Op;

                const count = await db.retailerSalesHeader.count({
                    where: {
                        retailerId: ownerId,
                        date: {
                            [Op.between]: [startDate, endDate]
                        }
                    }
                });

                const countSKUs = await db.stocks.count({
                    where: {
                        organisationId: ownerId,
                    }
                });

                const countDoctor = await db.doctors.count({
                    where: {
                        retailerId: ownerId,
                        createdAt: {
                            [Op.between]: [startDate, endDate]
                        }
                    }
                });

                return {
                    status: 200,
                    message: 'Retailer sales count fetched successfully.',
                    data: {
                        orderReceivedLast30days: count,
                        totalSKUs: countSKUs,
                        DoctorsAdded: countDoctor
                    }
                };

            } else {
                // Fetch product count, retailer count, and order stats using Sequelize ORM
                const [productStats, retailerStats, orderStats] = await Promise.all([
                    db.products.count({
                        where: { manufacturerId: Number(ownerId) },
                    }),

                    db.authorizations.count({
                        where: { authorizedBy: Number(ownerId) },
                    }),

                    db.orders.findAll({
                        attributes: [
                            [db.Sequelize.fn('COUNT', db.Sequelize.col('id')), 'orderReceived'],
                            [db.Sequelize.fn('SUM',
                                db.Sequelize.literal(`CASE WHEN DATE(createdAt) = CURDATE() THEN 1 ELSE 0 END`)
                            ), 'orderReceivedToday'],
                        ],
                        where: {
                            orderTo: Number(ownerId),
                            createdAt: {
                                [db.Sequelize.Op.gte]: db.Sequelize.literal('DATE_SUB(NOW(), INTERVAL 30 DAY)'),
                            },
                        },
                        raw: true,
                    }),
                ]);

                // Extract values with default fallback
                const totalProducts = productStats || 0;
                const retailersApproved = retailerStats || 0;
                const orderReceived = orderStats?.[0]?.orderReceived || 0;
                const orderReceivedToday = Number(orderStats?.[0]?.orderReceivedToday) || 0;

                return {
                    status: message.code200,
                    message: message.message200,
                    apiData: { totalProducts, retailersApproved, orderReceived, orderReceivedToday },
                };
            }
        } catch (error) {
            console.error('distProductInfo service error:', error.message);
            return {
                status: message.code500,
                message: message.message500,
            };
        }
    }

    async distributorRequest(tokenData, statusFilter = '', page = 1, limit = 10) {
        try {
            let ownerId = tokenData.id;
            let Page = Number(page)
            let Limit = Number(limit)

            if (tokenData?.userType === 'Employee') {
                ownerId = tokenData.data.employeeOf;
            }
            let skip = 0
            if (Page > 1) {
                skip = Number(Page - 1) * Number(Limit)
            }
            let whereClause = { authorizedBy: Number(ownerId) }
            // console.log(page,limit,skip)
            const validStatuses = ['Pending', 'Approved', 'Rejected'];
            // if (statusFilter !== 'All' && !validStatuses.includes(statusFilter)) {
            //     throw new Error('Invalid status filter provided');
            // }
            if (statusFilter && statusFilter != 'All') {
                whereClause.status = statusFilter
            } else {
                whereClause.status = {
                    [db.Op.in]: ['Pending', 'Approved', 'Rejected']
                };
            }

            // console.log('OwnerId:', ownerId,whereClause);
            // console.log('Status Filter Applied:', statusFilter !== 'All' ? statusFilter : 'No Filter');
            // console.log(whereClause,';;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;')
            // Fetch authorized distributors & retailers in a single query
            const { rows: authorizedEntities, count } = await db.authorizations.findAndCountAll({
                where: whereClause,
                attributes: ['authorizedId', 'status'],
                include: [
                    {
                        model: db.distributors,
                        as: 'distributors',
                        attributes: [
                            'distributorId', 'companyName', 'wholeSaleDrugLicence',
                            'address', 'phone', 'profilePic', 'createdAt'
                        ],
                        required: false
                    },
                    {
                        model: db.retailers,
                        as: 'retailers',
                        attributes: [
                            'retailerId', 'firmName', 'drugLicense',
                            'address', 'phone', 'profilePic', 'createdAt'
                        ],
                        required: false
                    },
                    {
                        model: db.address,
                        as: 'address',
                        attributes: ['addLine1', 'city', 'userId'],
                        where: { addressType: "Business" },
                        required: false
                    }
                ],
                // raw: true,
                offset: skip,
                limit: Limit
            });
            const pendingcount = await db.authorizations.count({ where: { authorizedBy: Number(ownerId), status: 'Pending' } })
            // console.log(count,'ppppppppppp')
            const retailersApproved = authorizedEntities.map(entity => {
                const createdAt = entity?.distributors?.createdAt || entity?.retailers?.createdAt;
                const daysSinceCreated = createdAt
                    ? Math.floor((new Date().getTime() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24))
                    : null;

                return {
                    authorizedId: entity?.distributors?.distributorId || entity?.retailers?.retailerId || null,
                    companyName: entity?.distributors?.companyName || entity?.retailers?.firmName || null,
                    address: entity?.address[0]?.addLine1 || entity?.address[0]?.addLine1 || null,
                    city: entity?.address[0]?.city || entity?.address[0]?.city || null,
                    phone: entity?.distributors?.phone || entity?.retailers?.phone || null,
                    status: entity?.status || null,
                    profilePic: entity?.distributors?.profilePic || entity?.retailers?.profilePic || null,
                    createdAt: createdAt || null,
                    daysSinceCreated: daysSinceCreated || null,
                    licence: entity?.distributors?.wholeSaleDrugLicence || entity?.retailers?.drugLicense || null
                };
            });


            // console.log('Retailers Approved:', authorizedEntities);

            return {
                status: message.code200,
                message: retailersApproved.length ? message.message200 : 'No authorized retailers or distributors found',
                totalItem: count,
                totalPage: Math.ceil(count / Number(limit)),
                currentPage: Number(page),
                pendingcount: pendingcount || 0,
                apiData: { retailersApproved },
            };
        } catch (error) {
            console.error('Distributor Request Error:', error.message);
            return {
                status: message.code500,
                message: message.message500,
            };
        }
    }

    //Stock running Low
    async stockRunningLow(tokenData) {
        try {
            let ownerId = tokenData.id;
            let checkUserType = tokenData.userType;

            if (tokenData?.userType === 'Employee') {
                checkUserType = tokenData.empOfType;
                ownerId = tokenData.data.employeeOf;
            }

            let stockModel;
            if (checkUserType === 'Manufacturer') {
                stockModel = db.manufacturerStocks
            } else {
                stockModel = db.stocks
            }

            console.log(tokenData.userType);
            console.log(ownerId);
            console.log(stockModel);

            // Get low stock threshold from the environment (default to 10 if not set)
            const lowStockThreshold = process.env.aboutToEmpty || 10;

            // Fetch all PId and Stock where stock is less than the threshold
            const lowStockItems = await stockModel.findAll({
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

            const groupedStock = lowStockItems.reduce((acc, stock) => {
                const existing = acc[stock.PId];
                if (existing) {
                    existing.Stock += stock.Stock; // Sum stock if PId already exists
                } else {
                    acc[stock.PId] = { PId: stock.PId, Stock: stock.Stock };
                }
                return acc;
            }, {});


            // Map product details with corresponding stock Stock
            const lowStockMedicines = Object.values(groupedStock).map(stock => {
                const product = productDetails.find(prod => prod.PId === stock.PId);
                return {
                    PId: stock.PId,
                    PName: product ? product.PName : 'Unknown',
                    Stock: stock.Stock
                };
            });

            //notification..................................................................................
            notificationsService.createNotification({
                organisationId: ownerId,
                category: "Stock Alert!!",
                title: "Low Stock Warning!!",
                description: `Your ${lowStockMedicines.length} medicines are running low. Please restock soon.`,
                status: "Unread",
            });
            // console.log(lowStockMedicines, "...............................")
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

    async topProducts(tokenData, filterType) {
        try {
            let ownerId = tokenData.id;
            let checkUserType = tokenData.userType;

            if (tokenData?.userType === 'Employee') {
                checkUserType = tokenData.empOfType;
                ownerId = tokenData.data.employeeOf;
            }

            if (filterType !== 'Revenue' && filterType !== 'Quantity') {
                throw new Error('Invalid filter type. Use "Revenue" or "Quantity".');
            }

            if (checkUserType === "Retailer") {
                // Get header IDs
                const headerIds = await db.retailerSalesHeader.findAll({
                    where: { retailerId: ownerId },
                    attributes: ['id'],
                    raw: true
                });

                const headerIdList = headerIds.map(h => h.id);
                if (!headerIdList.length) {
                    return {
                        status: 200,
                        message: "No sales data found for this retailer.",
                        apiData: []
                    };
                }

                // Get total value for percentage calculation
                const totalResult = await db.retailerSalesDetails.findOne({
                    where: { headerId: headerIdList },
                    attributes: [
                        [filterType === 'Revenue'
                            ? db.Sequelize.literal('SUM(qty * rate)')
                            : db.Sequelize.literal('SUM(qty)'),
                            'total_value']
                    ],
                    raw: true
                });

                const totalValue = parseFloat(totalResult?.total_value || 1); // prevent division by zero

                // Main query for top products
                const results = await db.retailerSalesDetails.findAll({
                    where: {
                        headerId: headerIdList
                    },
                    attributes: [
                        'PId',
                        [
                            filterType === 'Revenue'
                                ? db.Sequelize.literal('SUM(qty * rate)')
                                : db.Sequelize.literal('SUM(qty)'),
                            'value'
                        ],
                        [
                            db.Sequelize.literal(`ROUND((
                                ${filterType === 'Revenue' ? 'SUM(qty * rate)' : 'SUM(qty)'} / ${totalValue}
                            ) * 100, 2)`),
                            'percentage'
                        ]
                    ],
                    include: [
                        {
                            model: db.products,
                            as: 'product', 
                            attributes: ['PCode', 'PName']
                        }
                    ],
                    group: ['PId', 'product.PCode', 'product.PName'],
                    order: [[db.Sequelize.literal('value'), 'DESC']],
                    raw: true
                });

                // Flatten product fields into top level
                const formattedResults = results.map(r => ({
                    PId: r.PId,
                    PCode: r['product.PCode'],
                    PName: r['product.PName'],
                    value: parseFloat(r.value),
                    percentage: parseFloat(r.percentage),
                }));

                return {
                    status: 200,
                    message: "Top products fetched successfully.",
                    apiData: formattedResults
                };
            } 

            else if (checkUserType === "Manufacturer" || checkUserType === "Distributor") {

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
            }
        } catch (error) {
            console.error('Error in Statistics_four:', error.message);
            return {
                status: message.code500,
                message: message.message500
            };
        }
    }

    // Finding top retailers for Distributors
    // async topRetailers(tokenData) {
    //     try {
    //         let ownerId = tokenData.id;

    //         if (tokenData.userType === 'Employee') {
    //             ownerId = tokenData.data.employeeOf;
    //         }

    //         // console.log("Owner ID: ", ownerId);

    //         // SQL query to get top retailers by invAmt for a specific ownerId
    //         const query = `
    //             SELECT r.retailerId, r.firmName, SUM(o.invAmt) AS total_invAmt
    //             FROM orders o
    //             JOIN retailers r ON o.orderFrom = r.retailerId
    //             WHERE o.orderTo = :ownerId
    //             GROUP BY r.retailerId, r.firmName
    //             HAVING total_invAmt > 0
    //             ORDER BY total_invAmt DESC;
    //         `;

    //         const results = await db.sequelize.query(query, {
    //             type: db.Sequelize.QueryTypes.SELECT,
    //             replacements: { ownerId }
    //         });

    //         // console.log("Query results: ", results);

    //         return {
    //             status: message.code200,
    //             message: message.message200,
    //             apiData: results
    //         };
    //     } catch (error) {
    //         console.error('Error in Statistics_five:', error);
    //         return {
    //             status: message.code500,
    //             message: message.message500
    //         };
    //     }
    // }

    async topRetailers(tokenData) {
        try {
            let ownerId = tokenData.id;
            if (tokenData.userType === 'Employee') {
                ownerId = tokenData.data.employeeOf;
            }

            console.log(`Fetching Top Retailers for Owner ID: ${ownerId}`);

            // Step 1: Find the latest month with orders
            const latestOrder = await db.orders.findOne({
                where: { orderTo: ownerId },
                attributes: [[db.Sequelize.fn('MAX', db.Sequelize.col('createdAt')), 'latestDate']],
                raw: true
            });

            if (!latestOrder || !latestOrder.latestDate) {
                console.log("❌ No orders found for any month.");
                return {
                    status: message.code200,
                    message: "No orders found for any month.",
                    apiData: []
                };
            }

            const latestMonth = new Date(latestOrder.latestDate);
            const startDate = new Date(latestMonth.getFullYear(), latestMonth.getMonth(), 1); // First day of the latest month
            const endDate = new Date(latestMonth.getFullYear(), latestMonth.getMonth() + 1, 0, 23, 59, 59); // Last day of the latest month

            console.log(`Latest Month Found: ${startDate.toISOString()} - ${endDate.toISOString()}`);

            // Step 2: Get total invoice amount for that month
            const totalInvAmtResult = await db.orders.findOne({
                where: {
                    orderTo: ownerId,
                    createdAt: { [db.Sequelize.Op.between]: [startDate, endDate] }
                },
                attributes: [[db.Sequelize.fn('SUM', db.Sequelize.col('invAmt')), 'totalInvAmt']],
                raw: true
            });

            const totalInvAmt = totalInvAmtResult.totalInvAmt || 0;
            console.log(`Total Invoice Amount for the Month: ${totalInvAmt}`);

            if (totalInvAmt === 0) {
                console.log("❌ No invoice amount for the latest month.");
                return {
                    status: message.code200,
                    message: "No invoice amount for the latest month.",
                    apiData: []
                };
            }

            // Step 3: Fetch top retailers for the latest month
            const query = `
            SELECT r.retailerId, r.firmName, SUM(o.invAmt) AS total_invAmt
            FROM orders o
            JOIN retailers r ON o.orderFrom = r.retailerId
            WHERE o.orderTo = :ownerId 
              AND o.createdAt BETWEEN :startDate AND :endDate
            GROUP BY r.retailerId, r.firmName
            HAVING total_invAmt > 0
            ORDER BY total_invAmt DESC;
        `;

            const results = await db.sequelize.query(query, {
                type: db.Sequelize.QueryTypes.SELECT,
                replacements: { ownerId, startDate, endDate }
            });

            console.log("Retailers Data Before Percentage Calculation:", results);

            // Step 4: Calculate percentage of total invoice amount
            const retailersWithPercentage = results.map(retailer => ({
                ...retailer,
                percentage: ((retailer.total_invAmt / totalInvAmt) * 100).toFixed(2) + "%"
            }));

            console.log("Retailers Data After Percentage Calculation:", retailersWithPercentage);

            return {
                status: message.code200,
                message: message.message200,
                apiData: retailersWithPercentage
            };
        } catch (error) {
            console.error("❌ Error in topRetailers:", error);
            return {
                status: message.code500,
                message: message.message500
            };
        }
    }


    //Finding top distributors for Manufacturers
    // async topDistributors(tokenData) {
    //     try {
    //         let ownerId = tokenData.id;

    //         if (tokenData.userType === 'Employee') {
    //             ownerId = tokenData.data.employeeOf;
    //         }

    //         const results = await db.orders.findAll({
    //             attributes: [
    //                 'orderFrom',
    //                 [db.Sequelize.col('distributer.companyName'), 'companyName'],
    //                 [db.Sequelize.fn('SUM', db.Sequelize.col('invAmt')), 'total_invAmt']
    //             ],
    //             include: [
    //                 {
    //                     model: db.distributors,
    //                     as: 'distributer', // <-- Use the correct alias
    //                     attributes: []
    //                 }
    //             ],
    //             where: { orderTo: ownerId },
    //             group: ['orderFrom', 'distributer.companyName'],
    //             having: db.Sequelize.literal('total_invAmt > 0'),
    //             order: [[db.Sequelize.literal('total_invAmt'), 'DESC']],
    //             raw: true
    //         });

    //         console.log(results);

    //         return {
    //             status: message.code200,
    //             message: message.message200,
    //             apiData: results
    //         };
    //     } catch (error) {
    //         console.error('Error in topDistributors:', error);
    //         return {
    //             status: message.code500,
    //             message: message.message500
    //         };
    //     }
    // }

    async topDistributorsandretailers(tokenData) {
        try {
            let ownerId = tokenData.id;
            if (tokenData.userType === 'Employee') {
                ownerId = tokenData.data.employeeOf;
            }

            console.log(`Fetching Top Entities for Owner ID: ${ownerId}`);

            // Step 1: Find the latest month with orders
            const latestOrder = await db.orders.findOne({
                where: { orderTo: ownerId },
                attributes: [[db.Sequelize.fn('MAX', db.Sequelize.col('createdAt')), 'latestDate']],
                raw: true
            });

            if (!latestOrder || !latestOrder.latestDate) {
                console.log("❌ No orders found for any month.");
                return {
                    status: message.code200,
                    message: "No orders found for any month.",
                    apiData: []
                };
            }

            const latestMonth = new Date(latestOrder.latestDate);
            const startDate = new Date(latestMonth.getFullYear(), latestMonth.getMonth(), 1); // First day of the latest month
            const endDate = new Date(latestMonth.getFullYear(), latestMonth.getMonth() + 1, 0, 23, 59, 59); // Last day of the latest month

            console.log(`Latest Month Found: ${startDate.toISOString()} - ${endDate.toISOString()}`);

            // Step 2: Get total invoice amount for that month
            const totalInvAmtResult = await db.orders.findOne({
                where: {
                    orderTo: ownerId,
                    createdAt: { [db.Sequelize.Op.between]: [startDate, endDate] }
                },
                attributes: [[db.Sequelize.fn('SUM', db.Sequelize.col('invAmt')), 'totalInvAmt']],
                raw: true
            });

            const totalInvAmt = totalInvAmtResult.totalInvAmt || 0;
            console.log(`Total Invoice Amount for the Month: ${totalInvAmt}`);

            if (totalInvAmt === 0) {
                console.log("❌ No invoice amount for the latest month.");
                return {
                    status: message.code200,
                    message: "No invoice amount for the latest month.",
                    apiData: []
                };
            }

            // Step 3: Fetch orders grouped by orderFrom with entity details
            const results = await db.orders.findAll({
                attributes: [
                    'orderFrom',
                    [db.Sequelize.fn('SUM', db.Sequelize.col('invAmt')), 'total_invAmt']
                ],
                include: [
                    {
                        model: db.distributors,
                        as: 'distributer',
                        attributes: ['distributorId', 'companyName', 'type', 'profilePic']
                    },
                    {
                        model: db.retailers,
                        as: 'fromRetailer',
                        attributes: ['retailerId', 'firmName', 'profilePic']
                    },
                    {
                        model: db.users,
                        as: 'orderFromUser',
                        attributes: ['id', 'userType']
                    }
                ],
                where: {
                    orderTo: ownerId,
                    createdAt: { [db.Sequelize.Op.between]: [startDate, endDate] }
                },
                group: ['orderFrom', 'distributer.distributorId', 'fromRetailer.retailerId', 'orderFromUser.id'],
                having: db.Sequelize.literal('total_invAmt > 0'),
                order: [[db.Sequelize.literal('total_invAmt'), 'DESC']],
                raw: true,
                nest: true
            });
            console.log(results, ';;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;')
            // Step 4: Format output with either distributor or retailer data
            const topEntities = results.map(entity => ({
                orderFrom: entity?.distributer?.distributorId || entity?.fromRetailer?.retailerId || null,
                companyName: entity?.distributer?.companyName || entity?.fromRetailer?.firmName || null,
                logo: entity?.distributer?.profilePic || entity?.fromRetailer?.profilePic || null,
                userType: entity?.orderFromUser?.userType || null,
                total_invAmt: parseFloat(entity?.total_invAmt),
                percentage: ((entity?.total_invAmt / totalInvAmt) * 100).toFixed(2) + "%"
            }));

            return {
                status: message.code200,
                message: message.message200,
                apiData: topEntities
            };
        } catch (error) {
            console.error("❌ Error in topEntities:", error);
            return {
                status: message.code500,
                message: message.message500
            };
        }
    }

    //KPIs API.......
    async getDashboardStatsToday(tokenData, dateString) {
        try {
            // If date is passed, use it; otherwise, use today's date
            const date = dateString ? new Date(dateString) : new Date();
            const startOfDay = new Date(date.setHours(0, 0, 0, 0));
            startOfDay.setMinutes(startOfDay.getMinutes() + 330);

            const endOfDay = new Date(date.setHours(23, 59, 59, 999));
            endOfDay.setMinutes(endOfDay.getMinutes() + 330);
            // console.log("toeknData : ", tokenData);

            let checkUserType = tokenData.userType;
            if (tokenData?.userType === 'Employee') {
                checkUserType = tokenData.empOfType;
            }

            if (checkUserType === "Manufacturer" || checkUserType === "Distributor") {
                const [
                    topProductsResult,
                    topCitiesResult,
                    paymentsCollectedResult,
                    cancelledOrders,
                    newlyOnboardedCount,
                    countExpiringSoon,
                ] = await Promise.all([
                    this.getTopProductsToday(tokenData, startOfDay, endOfDay),
                    this.getTop_Three_Cities(tokenData, startOfDay, endOfDay),
                    this.getPayments_Collected_Today(tokenData, startOfDay, endOfDay),
                    this.getCancelledOrdersCount(tokenData, startOfDay, endOfDay),
                    this.getRecentApprovedAuthorizations(tokenData, startOfDay, endOfDay),
                    this.getExpiringMedicinesSoon(tokenData, startOfDay, endOfDay),

                ]);

                return {
                    status: 200,
                    message: "Dashboard stats for today fetched successfully.",
                    data: {
                        topProducts: topProductsResult.data || [],
                        topCities: topCitiesResult.data || [],
                        totalAmountReceivedToday: paymentsCollectedResult.data.totalAmountReceived || 0,
                        failedDispatches: cancelledOrders.cancelledOrdersCount || 0,
                        newlyOnboarded: newlyOnboardedCount.data.recentApprovedCount,
                        expirySoon: countExpiringSoon.expiringSoonCount || 0
                    }
                };
            } else if (checkUserType === "Retailer") {
                const [
                    topProductsResult,
                    paymentsCollectedResult,
                    newPatiendRegistered,
                    countExpiringSoon,
                    expiryRaised,
                ] = await Promise.all([
                    this.getTopProductsToday(tokenData, startOfDay, endOfDay),
                    this.getPayments_Collected_Today(tokenData, startOfDay, endOfDay),
                    this.getNewPatientRegistered(tokenData, startOfDay, endOfDay),
                    this.getExpiringMedicinesSoon(tokenData, startOfDay, endOfDay),
                    this.getExpiryRaised(tokenData, startOfDay, endOfDay),
                ]);

                return {
                    status: 200,
                    message: "Dashboard stats for today fetched successfully.",
                    data: {
                        topProducts: topProductsResult.data || [],
                        totalAmountReceivedToday: paymentsCollectedResult.data.totalAmountReceived || 0,
                        newPatiendRegistered: newPatiendRegistered?.countPatientsRegistered,
                        expirySoon: countExpiringSoon.expiringSoonCount || 0,
                        expiryRaised: expiryRaised?.data.count,
                    }
                };
            }
        } catch (error) {
            console.error("❌ Error in getDashboardStatsToday:", error);
            return {
                status: 500,
                message: error.message || "Internal Server Error",
            };
        }
    }
        //KPI functions....Start.................
        async getTopProductsToday(tokenData, startOfDay, endOfDay) {
            try {

                let ownerId = tokenData.id;
                if (tokenData?.userType === 'Employee') {
                    ownerId = tokenData.data.employeeOf;
                }

                // const startOfDay = new Date();
                // startOfDay.setHours(0, 0, 0, 0);

                // const endOfDay = new Date();
                // endOfDay.setHours(23, 59, 59, 999);

                const topProducts = await db.orderitems.findAll({
                    attributes: [
                        'PId',
                        [db.Sequelize.fn('SUM', db.Sequelize.col('orderitems.Quantity')), 'totalQuantity'],
                        [db.Sequelize.fn('SUM', db.Sequelize.col('orderitems.netAmt')), 'amount']
                    ],
                    include: [
                        {
                            model: db.orders,
                            as: 'orders',
                            where: {
                                createdAt: {
                                    [Op.between]: [startOfDay, endOfDay]
                                },
                                orderTo: ownerId
                            },
                            attributes: []
                        },
                        {
                            model: db.products,
                            as: 'product',
                            attributes: ['PName']
                        }
                    ],
                    group: ['PId', 'product.PName'],
                    order: [[db.Sequelize.literal('totalQuantity'), 'DESC']],
                    limit: 1
                });

                if (!topProducts.length) {
                    return {
                        status: 404,
                        message: "No top products found for today",
                        data: []
                    };
                }

                const result = topProducts.map(item => ({
                    PId: item.PId,
                    PName: item.product?.PName || "Unnamed Product",
                    totalQuantity: parseInt(item.get('totalQuantity')),
                    amount: parseFloat(item.get('amount'))
                }));

                // console.log("🔝 Top Product Today:", result[0]); 

                return {
                    status: 200,
                    message: "Top product retrieved successfully",
                    data: result
                };

            } catch (error) {
                console.error("❌ Error in getTopProductsToday:", error);
                return {
                    status: 500,
                    message: error.message || "Internal Server Error"
                };
            }
        }
        async getTop_Three_Cities(tokenData, startOfDay, endOfDay) {
            try {

                let ownerId = tokenData.id;
                if (tokenData?.userType === 'Employee') {
                    ownerId = tokenData.data.employeeOf;
                }

                // const startOfDay = new Date();
                // startOfDay.setHours(0, 0, 0, 0);

                // const endOfDay = new Date();
                // endOfDay.setHours(23, 59, 59, 999);

                const orderItems = await db.orderitems.findAll({
                    attributes: [
                        'PId',
                        [Sequelize.fn('SUM', Sequelize.col('Quantity')), 'totalQuantity']
                    ],
                    include: [
                        {
                            model: db.orders,
                            as: 'orders',
                            attributes: ['id', 'orderFrom'],
                            where: {
                                createdAt: {
                                    [Op.between]: [startOfDay, endOfDay]
                                },
                                orderTo: ownerId
                            },
                            required: true
                        }
                    ],
                    group: ['PId', 'orders.id', 'orders.orderFrom'],
                    raw: true
                });

                const productTotals = {};

                for (const item of orderItems) {
                    const key = item.PId;
                    if (!productTotals[key]) {
                        productTotals[key] = {
                            PId: key,
                            totalQuantity: 0,
                            orders: []
                        };
                    }

                    productTotals[key].totalQuantity += parseInt(item.totalQuantity);
                    if (item['orders.orderFrom'] && item['orders.id']) {
                        productTotals[key].orders.push({
                            orderFrom: item['orders.orderFrom'],
                            orderId: item['orders.id']
                        });
                    }
                }

                const sortedProducts = Object.values(productTotals)
                    .sort((a, b) => b.totalQuantity - a.totalQuantity)
                    .slice(0, 3);

                const orderFromIds = [...new Set(
                    sortedProducts.flatMap(p => p.orders.map(o => o.orderFrom))
                )];

                const addresses = await db.address.findAll({
                    where: {
                        userId: {
                            [Op.in]: orderFromIds
                        },
                        addressType: 'Billing'
                    },
                    attributes: ['userId', 'city'],
                    raw: true
                });

                const cityCount = {};

                for (const product of sortedProducts) {
                    for (const order of product.orders) {
                        const address = addresses.find(a => a.userId === order.orderFrom);
                        if (address && address.city) {
                            const key = `${address.city}_${order.orderId}`;
                            if (!cityCount[key]) {
                                cityCount[key] = {
                                    city: address.city,
                                    orderId: order.orderId,
                                    count: 0
                                };
                            }
                            cityCount[key].count += 1;
                        }
                    }
                }

                const topCities = Object.values(cityCount)
                    .sort((a, b) => b.count - a.count)
                    .slice(0, 3)
                    .map(({ city, orderId, count }) => ({
                        city,
                        orderId,
                        orderCount: count
                    }));

                return {
                    status: 200,
                    message: "Top 3 cities retrieved successfully",
                    data: topCities
                };
            } catch (error) {
                console.error("Error in getTopCitiesToday:", error);
                return {
                    status: 500,
                    message: error.message || "Internal Server Error"
                };
            }
        }
        async getPayments_Collected_Today(tokenData, startOfDay, endOfDay) {
            try {

                let ownerId = tokenData.id;
                if (tokenData?.userType === 'Employee') {
                    ownerId = tokenData.data.employeeOf;
                }

                // const startOfDay = new Date();
                // startOfDay.setHours(0, 0, 0, 0);

                // const endOfDay = new Date();
                // endOfDay.setHours(23, 59, 59, 999);

                // Step 1: Get today's orders where orderTo = tokenData.id
                const orders = await db.orders.findAll({
                    where: {
                        orderTo: ownerId,
                        createdAt: {
                            [Op.between]: [startOfDay, endOfDay],
                        },
                    },
                    attributes: ['id'],
                    raw: true
                });

                const orderIds = orders.map(order => order.id);

                if (orderIds.length === 0) {
                    return {
                        status: 200,
                        message: "No payments collected for today.",
                        data: {
                            totalAmountReceived: 0,
                        }
                    };
                }

                // Step 2: Get payments for those orderIds
                const result = await db.payments.findAll({
                    where: {
                        orderId: {
                            [Op.in]: orderIds
                        },
                        status: 'Confirmed',
                        updatedAt: {
                            [Op.between]: [startOfDay, endOfDay],
                        }
                    },
                    attributes: [
                        [db.Sequelize.fn('SUM', db.Sequelize.col('amount')), 'totalAmountReceived'],
                    ],
                    raw: true,
                });

                return {
                    status: 200,
                    message: "Data fetched successfully.",
                    data: {
                        totalAmountReceived: result[0].totalAmountReceived || 0,
                    }
                };
            } catch (error) {
                console.error('Error in getPayments_Collected_Today:', error);
                return {
                    status: 500,
                    message: error.message,
                };
            }
        }
        async getCancelledOrdersCount(tokenData) {
            try {

                let ownerId = tokenData.id;
                if (tokenData?.userType === 'Employee') {
                    ownerId = tokenData.data.employeeOf;
                }

                // Query to count orders where the status is 'Cancelled'
                const cancelledOrders = await db.orders.count({
                    where: {
                        orderStatus: 'Cancelled',
                        [Op.or]: [
                            { orderFrom: ownerId },
                            { orderTo: ownerId }
                        ]
                    }
                });

                return {
                    status: 200,
                    message: "Cancelled orders count fetched successfully.",
                    cancelledOrdersCount: cancelledOrders
                };

            } catch (error) {
                console.error("❌ Error in getCancelledOrdersCount:", error);
                return {
                    status: 500,
                    message: error.message || "Internal Server Error"
                };
            }
        }
        async getRecentApprovedAuthorizations(tokenData) {
            try {
                let organisationId = tokenData.id;

                if (tokenData.userType === 'Employee') {
                    organisationId = tokenData.data.employeeOf;
                }

                const today = new Date();
                today.setHours(23, 59, 59, 999);

                const thirtyDaysAgo = new Date();
                thirtyDaysAgo.setDate(today.getDate() - 30);
                thirtyDaysAgo.setHours(0, 0, 0, 0);

                const count = await db.authorizations.count({
                    where: {
                        [Op.or]: [
                            { authorizedBy: organisationId },
                            { authorizedId: organisationId }
                        ],
                        status: 'Approved',
                        createdAt: {
                            [Op.between]: [thirtyDaysAgo, today]
                        }
                    }
                });

                return {
                    status: 200,
                    message: "Approved authorizations fetched successfully.",
                    data: {
                        recentApprovedCount: count
                    }
                };
            } catch (error) {
                console.error("❌ Error in getRecentApprovedAuthorizations:", error);
                return {
                    status: 500,
                    message: error.message || "Internal Server Error"
                };
            }
        }
        async getExpiringMedicinesSoon(tokenData) {
            try {
                // const userType = tokenData.userType;
                let organisationId = tokenData.id;

                let checkUserType = tokenData.userType;
                if (tokenData?.userType === 'Employee') {
                    organisationId = tokenData.data.employeeOf;
                    checkUserType = tokenData.empOfType;
                }

                // Convert to local time (IST) and format as 'YYYY-MM-DD HH:mm:ss'
                const today = new Date();
                today.setHours(0, 0, 0, 0);

                const ninetyDaysLater = new Date(today);
                ninetyDaysLater.setDate(ninetyDaysLater.getDate() + 90);
                ninetyDaysLater.setHours(23, 59, 59, 999);

                const formatDateTime = (date) => {
                    return date.toISOString().slice(0, 19).replace('T', ' ');
                };

                const startDateStr = formatDateTime(today);
                const endDateStr = formatDateTime(ninetyDaysLater);

                let stockModel;
                if (checkUserType === 'Manufacturer') {
                    stockModel = db.manufacturerStocks;
                } else if (checkUserType === 'Distributor' || checkUserType === 'Retailer') {
                    stockModel = db.stocks;
                } else {
                    return {
                        status: 400,
                        message: "Invalid userType for checking expiry."
                    };
                }

                const countExpiringSoon = await stockModel.count({
                    where: {
                        organisationId,
                        ExpDate: {
                            [Op.between]: [startDateStr, endDateStr]
                        }
                    }
                });

                return {
                    status: 200,
                    message: "Expiring medicines fetched successfully.",
                    data: {
                        expiringSoonCount: countExpiringSoon
                    }
                };
            } catch (error) {
                console.error("❌ Error in getExpiringMedicinesSoon:", error);
                return {
                    status: 500,
                    message: error.message || "Internal Server Error"
                };
            }
        }
        async getNewPatientRegistered(tokenData, startOfDay, endOfDay) {
            try {
                // const userType = tokenData.userType;
                let organisationId = tokenData.id;

                let checkUserType = tokenData.userType;
                if (tokenData?.userType === 'Employee') {
                    organisationId = tokenData.data.employeeOf;
                    checkUserType = tokenData.empOfType;
                }

                const countPatientsRegistered = await db.patients.count({
                    where: {
                        retailerId: organisationId,
                        createdAt: {
                            [Op.between]: [startOfDay, endOfDay]
                        }
                    }
                });

                return {
                    countPatientsRegistered: countPatientsRegistered
                };
            } catch (error) {
                console.error("❌ Error in getExpiringMedicinesSoon:", error);
                return {
                    status: 500,
                    message: error.message || "Internal Server Error"
                };
            }
        }
        async getExpiryRaised(tokenData, startOfDay, endOfDay) {
            try {
                let userId = tokenData.id;
                if (tokenData.userType === 'Employee') {
                    userId = tokenData.data.employeeOf;
                }

                const headers = await db.returnHeader.findAll({
                    where: {
                        returnFrom: userId,
                        returnDate: {
                            [Op.between]: [startOfDay, endOfDay]
                        }
                    },
                    attributes: ['returnId'],
                    raw: true
                });

                const returnIds = headers.map(h => h.returnId);

                if (!returnIds.length) {
                    return {
                        status: 200,
                        message: 'No returns found for given date',
                        data: { count: 0 }
                    };
                }

                const count = await db.returnDetails.count({
                    where: {
                        returnId: {
                            [Op.in]: returnIds
                        }
                    }
                });

                return {
                    status: 200,
                    message: 'Expiry returns fetched successfully',
                    data: {
                        count
                    }
                };
            } catch (error) {
                console.error('❌ Error in getExpiryReturns:', error);
                return {
                    status: 500,
                    message: 'Internal Server Error',
                    error: error.message
                };
            }
        }

        //KPI functions....end.................


    //SO PO related Card Data API....
    async getPaymentRelatedStats(tokenData, dateString) {
        try {
            // If date is passed, use it; otherwise, use today's date
            const date = dateString ? new Date(dateString) : new Date();

            const startOfDay = new Date(date.setHours(0, 0, 0, 0));
            startOfDay.setMinutes(startOfDay.getMinutes() + 330);

            const endOfDay = new Date(date.setHours(23, 59, 59, 999));
            endOfDay.setMinutes(endOfDay.getMinutes() + 330);


            let checkUserType = tokenData.userType;
            if (tokenData?.userType === 'Employee') {
                checkUserType = tokenData.empOfType;
            }

            if (checkUserType === "Manufacturer" || checkUserType === "Distributor") {
                const [
                    paymentCollected,
                    soReceivedToday,
                    soProcessedToday,
                    pendingSo,
                    blackBoxResult,
                ] = await Promise.all([
                    this.paymentsCollected(tokenData, startOfDay, endOfDay),
                    this.getOrdersReceivedToday(tokenData, startOfDay, endOfDay),
                    this.getNonPendingOrdersReceivedToday(tokenData, startOfDay, endOfDay),
                    this.getPendingOrdersReceivedToday(tokenData, startOfDay, endOfDay),
                    this.blackBox(tokenData, startOfDay, endOfDay),
                ]);

                let userSpecificMetric = {};

                if (blackBoxResult?.type === 'Manufacturer') {
                    userSpecificMetric = { returnsReceivedToday: blackBoxResult.returnsReceivedToday || 0 };
                } else if (blackBoxResult?.type === 'Distributor') {
                    userSpecificMetric = { poRaisedToday: blackBoxResult.poRaisedToday || 0 };
                }

                return {
                    status: 200,
                    message: "Dashboard stats for today fetched successfully.",
                    data: {
                        paymentCollected: paymentCollected.data || 0,
                        soReceivedToday: soReceivedToday.data || 0,
                        soProcessedToday: soProcessedToday.data || 0,
                        pendingSo: pendingSo.data || 0,
                        ...userSpecificMetric
                    }
                }
            } else if (checkUserType === "Retailer") {
                const [
                    paymentCollected,
                    totalSalesToday,
                    totalPoRaisedToday,
                    poValueToday,
                    blackBoxResult,
                ] = await Promise.all([
                    this.retailerPaymentCollected(tokenData, startOfDay, endOfDay),
                    this.totalSalesToday(tokenData, startOfDay, endOfDay),
                    this.totalPoRaisedToday(tokenData, startOfDay, endOfDay),
                    this.poValueToday(tokenData, startOfDay, endOfDay),
                    this.blackBox(tokenData, startOfDay, endOfDay),
                ]);

                return {
                    status: 200,
                    message: "Dashboard stats for today fetched successfully.",
                    data: {
                        paymentCollected: paymentCollected?.data || 0,
                        totalSalesToday: totalSalesToday?.data,
                        totalPoRaisedToday: totalPoRaisedToday?.data || 0,
                        poValueToday: poValueToday?.data || 0,
                        expiryRaisedToday: blackBoxResult.expiryRaisedToday
                    }
                }
            }
        } catch (error) {
            console.error("❌ Error in getPaymentRelatedStats:", error);
            return {
                status: 500,
                message: error.message || "Internal Server Error",
            };
        }
    }
        //So PO functions....Start.................
        async paymentsCollected(tokenData, startOfDay, endOfDay) {
            try {
                let ownerId = tokenData.id;
                if (tokenData?.userType === 'Employee') {
                    ownerId = tokenData.data.employeeOf;
                }

                // ----- TODAY -----
                // const startOfDay = new Date();
                // startOfDay.setHours(0, 0, 0, 0);
                // startOfDay.setHours(startOfDay.getHours() + 5);
                // startOfDay.setMinutes(startOfDay.getMinutes() + 30);
                console.log("Today start date", startOfDay);

                // const endOfDay = new Date();
                // endOfDay.setHours(23, 59, 59, 999);
                // endOfDay.setHours(endOfDay.getHours() + 5);
                // endOfDay.setMinutes(endOfDay.getMinutes() + 30);
                console.log("Today end date", endOfDay);

                // ----- YESTERDAY -----
                const startOfYesterday = new Date(startOfDay);
                startOfYesterday.setDate(startOfYesterday.getDate() - 1);
                console.log("yesterday start date", startOfYesterday);

                const endOfYesterday = new Date(endOfDay);
                endOfYesterday.setDate(endOfYesterday.getDate() - 1);
                console.log("yesterday end date", endOfYesterday);

                // --- Step 1: Get today's order IDs ---
                const todayOrders = await db.orders.findAll({
                    where: {
                        orderTo: ownerId,
                        createdAt: {
                            [Op.between]: [startOfDay, endOfDay],
                        },
                    },
                    attributes: ['id'],
                    raw: true,
                });

                const todayOrderIds = todayOrders.map(order => order.id);

                // --- Step 2: Get yesterday's order IDs ---
                const yesterdayOrders = await db.orders.findAll({
                    where: {
                        orderTo: ownerId,
                        createdAt: {
                            [Op.between]: [startOfYesterday, endOfYesterday],
                        },
                    },
                    attributes: ['id'],
                    raw: true,
                });
                // console.log(startOfYesterday)

                const yesterdayOrderIds = yesterdayOrders.map(order => order.id);

                // --- Step 3: Get today's payments ---
                const todayResult = todayOrderIds.length > 0 ? await db.payments.findAll({
                    where: {
                        orderId: { [Op.in]: todayOrderIds },
                        status: 'Confirmed',
                        updatedAt: {
                            [Op.between]: [startOfDay, endOfDay],
                        }
                    },
                    attributes: [
                        [db.Sequelize.fn('SUM', db.Sequelize.col('amount')), 'totalAmountReceived'],
                    ],
                    raw: true,
                }) : [{ totalAmountReceived: 0 }];

                const todayAmount = parseFloat(todayResult[0].totalAmountReceived) || 0;

                // --- Step 4: Get yesterday's payments ---
                const yesterdayResult = yesterdayOrderIds.length > 0 ? await db.payments.findAll({
                    where: {
                        orderId: { [Op.in]: yesterdayOrderIds },
                        status: 'Confirmed',
                        updatedAt: {
                            [Op.between]: [startOfYesterday, endOfYesterday],
                        }
                    },
                    attributes: [
                        [db.Sequelize.fn('SUM', db.Sequelize.col('amount')), 'totalAmountReceived'],
                    ],
                    raw: true,
                }) : [{ totalAmountReceived: 0 }];

                const yesterdayAmount = parseFloat(yesterdayResult[0].totalAmountReceived) || 0;

                // --- Step 5: Calculate percentage change ---
                let percentageChange = 0;
                if (yesterdayAmount > 0) {
                    percentageChange = ((todayAmount - yesterdayAmount) / yesterdayAmount) * 100;
                } else if (todayAmount > 0) {
                    percentageChange = 100;
                } else {
                    percentageChange = 0;
                }

                return {
                    status: 200,
                    message: "Data fetched successfully.",
                    data: {
                        totalAmountReceivedToday: todayAmount,
                        // totalAmountReceivedYesterday: yesterdayAmount,
                        percentageChange: Number(percentageChange.toFixed(2))
                    }
                };
            } catch (error) {
                console.error('Error in getPayments_Collected_Today:', error);
                return {
                    status: 500,
                    message: error.message,
                };
            }
        }
        async getOrdersReceivedToday(tokenData, startOfDay, endOfDay) {
            try {
                let ownerId = tokenData.id;

                if (tokenData?.userType === 'Employee') {
                    ownerId = tokenData.data.employeeOf;
                }

                // ----- TODAY -----
                // const startOfDay = new Date();
                // startOfDay.setHours(0, 0, 0, 0);
                // startOfDay.setMinutes(startOfDay.getMinutes() + 330); // Add 5.5 hrs

                // const endOfDay = new Date();
                // endOfDay.setHours(23, 59, 59, 999);
                // endOfDay.setMinutes(endOfDay.getMinutes() + 330); // Add 5.5 hrs

                // ----- YESTERDAY -----
                const startOfYesterday = new Date(startOfDay);
                startOfYesterday.setDate(startOfYesterday.getDate() - 1);

                const endOfYesterday = new Date(endOfDay);
                endOfYesterday.setDate(endOfYesterday.getDate() - 1);

                // 1. Count orders today
                const orderCount = await db.orders.count({
                    where: {
                        orderTo: ownerId,
                        createdAt: {
                            [Op.between]: [startOfDay, endOfDay]
                        }
                    }
                });

                // 2. Total invAmt today
                const todayTotal = await db.orders.findOne({
                    where: {
                        orderTo: ownerId,
                        createdAt: {
                            [Op.between]: [startOfDay, endOfDay]
                        }
                    },
                    attributes: [
                        [db.Sequelize.fn('SUM', db.Sequelize.col('invAmt')), 'totalInvAmt']
                    ],
                    raw: true
                });

                const totalToday = parseFloat(todayTotal.totalInvAmt || 0);

                // 3. Total invAmt yesterday
                const yesterdayTotal = await db.orders.findOne({
                    where: {
                        orderTo: ownerId,
                        createdAt: {
                            [Op.between]: [startOfYesterday, endOfYesterday]
                        }
                    },
                    attributes: [
                        [db.Sequelize.fn('SUM', db.Sequelize.col('invAmt')), 'totalInvAmt']
                    ],
                    raw: true
                });

                const totalYesterday = parseFloat(yesterdayTotal.totalInvAmt || 0);

                // 4. Calculate percentage change
                let percentageChange = 0;
                if (totalYesterday > 0) {
                    percentageChange = ((totalToday - totalYesterday) / totalYesterday) * 100;
                } else if (totalToday > 0) {
                    percentageChange = 100;
                }

                return {
                    status: 200,
                    message: "Orders and invAmt stats fetched successfully.",
                    data: {
                        SoReceivedToday: orderCount,
                        totalInvAmtToday: totalToday,
                        // totalInvAmtYesterday: totalYesterday,
                        percentageChange: parseFloat(percentageChange.toFixed(2))
                    }
                };

            } catch (error) {
                console.error("❌ Error in getOrdersReceivedToday:", error);
                return {
                    status: 500,
                    message: error.message || "Internal Server Error"
                };
            }
        }
        async getNonPendingOrdersReceivedToday(tokenData, startOfDay, endOfDay) {
            try {
                let ownerId = tokenData.id;

                if (tokenData?.userType === 'Employee') {
                    ownerId = tokenData.data.employeeOf;
                }

                // Start & End of Today (IST)
                // const startOfDay = new Date();
                // startOfDay.setHours(0, 0, 0, 0);
                // startOfDay.setMinutes(startOfDay.getMinutes() + 330); 

                // const endOfDay = new Date();
                // endOfDay.setHours(23, 59, 59, 999);
                // endOfDay.setMinutes(endOfDay.getMinutes() + 330);


                // Start & End of Yesterday
                const startOfYesterday = new Date(startOfDay);
                startOfYesterday.setDate(startOfYesterday.getDate() - 1);

                const endOfYesterday = new Date(endOfDay);
                endOfYesterday.setDate(endOfYesterday.getDate() - 1);

                // 1. Count Non-Pending Orders Today
                const orderCount = await db.orders.count({
                    where: {
                        orderTo: ownerId,
                        orderStatus: {
                            [Op.ne]: 'Pending'
                        },
                        confirmationDate: {
                            [Op.between]: [startOfDay, endOfDay]
                        }
                    }
                });

                // 2. Total invAmt Today
                const todayTotal = await db.orders.findOne({
                    where: {
                        orderTo: ownerId,
                        orderStatus: {
                            [Op.ne]: 'Pending'
                        },
                        confirmationDate: {
                            [Op.between]: [startOfDay, endOfDay]
                        }
                    },
                    attributes: [
                        [db.Sequelize.fn('SUM', db.Sequelize.col('invAmt')), 'totalInvAmt']
                    ],
                    raw: true
                });

                const totalToday = parseFloat(todayTotal.totalInvAmt || 0);

                // 3. Total invAmt Yesterday
                const yesterdayTotal = await db.orders.findOne({
                    where: {
                        orderTo: ownerId,
                        orderStatus: {
                            [Op.ne]: 'Pending'
                        },
                        confirmationDate: {
                            [Op.between]: [startOfYesterday, endOfYesterday]
                        }
                    },
                    attributes: [
                        [db.Sequelize.fn('SUM', db.Sequelize.col('invAmt')), 'totalInvAmt']
                    ],
                    raw: true
                });

                const totalYesterday = parseFloat(yesterdayTotal.totalInvAmt || 0);

                // 4. Percentage Change
                let percentageChange = 0;
                if (totalYesterday > 0) {
                    percentageChange = ((totalToday - totalYesterday) / totalYesterday) * 100;
                } else if (totalToday > 0) {
                    percentageChange = 100;
                }

                return {
                    status: 200,
                    message: "Non-pending orders stats fetched successfully.",
                    data: {
                        SoProcessedToday: orderCount,
                        totalInvAmtToday: totalToday,
                        // totalInvAmtYesterday: totalYesterday,
                        percentageChange: parseFloat(percentageChange.toFixed(2))
                    }
                };
            } catch (error) {
                console.error("❌ Error in getNonPendingOrdersReceivedToday:", error);
                return {
                    status: 500,
                    message: error.message || "Internal Server Error"
                };
            }
        }
        async getPendingOrdersReceivedToday(tokenData, startOfDay, endOfDay) {
            try {
                let ownerId = tokenData.id;

                if (tokenData?.userType === 'Employee') {
                    ownerId = tokenData.data.employeeOf;
                }

                // IST time range for today
                // const startOfDay = new Date();
                // startOfDay.setHours(0, 0, 0, 0);
                // startOfDay.setMinutes(startOfDay.getMinutes() + 330); // Add 5.5 hrs

                // const endOfDay = new Date();
                // endOfDay.setHours(23, 59, 59, 999);
                // endOfDay.setMinutes(endOfDay.getMinutes() + 330);

                // IST time range for yesterday
                const startOfYesterday = new Date(startOfDay);
                startOfYesterday.setDate(startOfYesterday.getDate() - 1);

                const endOfYesterday = new Date(endOfDay);
                endOfYesterday.setDate(endOfYesterday.getDate() - 1);

                // Count of pending orders today
                const pendingOrderCount = await db.orders.count({
                    where: {
                        orderTo: ownerId,
                        orderStatus: 'Pending',
                        createdAt: {
                            [Op.between]: [startOfDay, endOfDay]
                        }
                    }
                });

                // Total orderTotal for today
                const todayTotal = await db.orders.findOne({
                    where: {
                        orderTo: ownerId,
                        orderStatus: 'Pending',
                        createdAt: {
                            [Op.between]: [startOfDay, endOfDay]
                        }
                    },
                    attributes: [
                        [db.Sequelize.fn('SUM', db.Sequelize.col('orderTotal')), 'totalOrderAmt']
                    ],
                    raw: true
                });

                const totalToday = parseFloat(todayTotal.totalOrderAmt || 0);

                // Total orderTotal for yesterday
                const yesterdayTotal = await db.orders.findOne({
                    where: {
                        orderTo: ownerId,
                        orderStatus: 'Pending',
                        createdAt: {
                            [Op.between]: [startOfYesterday, endOfYesterday]
                        }
                    },
                    attributes: [
                        [db.Sequelize.fn('SUM', db.Sequelize.col('orderTotal')), 'totalOrderAmt']
                    ],
                    raw: true
                });

                const totalYesterday = parseFloat(yesterdayTotal.totalOrderAmt || 0);

                // Calculate percentage change
                let percentageChange = 0;
                if (totalYesterday > 0) {
                    percentageChange = ((totalToday - totalYesterday) / totalYesterday) * 100;
                } else if (totalToday > 0) {
                    percentageChange = 100;
                }

                return {
                    status: 200,
                    message: "Pending orders stats fetched successfully.",
                    data: {
                        pendingSo: pendingOrderCount,
                        totalOrderAmtToday: totalToday,
                        // totalOrderAmtYesterday: totalYesterday,
                        percentageChange: parseFloat(percentageChange.toFixed(2))
                    }
                };

            } catch (error) {
                console.error("❌ Error in getPendingOrdersReceivedToday:", error);
                return {
                    status: 500,
                    message: error.message || "Internal Server Error"
                };
            }
        }
        async blackBox(tokenData, startOfDay, endOfDay) {
            try {

                let ownerId = tokenData.id;
                if (tokenData?.userType === 'Employee') {
                    ownerId = tokenData.data.employeeOf;
                }
                let checkUserType = tokenData.userType;
                if (tokenData?.userType === 'Employee') {
                    checkUserType = tokenData.empOfType;
                }

                //Manufacturer Black Box
                if (checkUserType === 'Manufacturer') {
                    const count = await db.returnHeader.count({
                        where: {
                            returnTo: ownerId,
                            returnDate: {
                                [db.Sequelize.Op.between]: [startOfDay, endOfDay],
                            }
                        }
                    });

                    return {
                        type: 'Manufacturer',
                        returnsReceivedToday: count || 0
                    };
                }

                //Distributor Black Box
                if (checkUserType === 'Distributor') {
                    const count = await db.orders.count({
                        where: {
                            orderFrom: ownerId,
                            orderDate: {
                                [db.Sequelize.Op.between]: [startOfDay, endOfDay],
                            }
                        }
                    });

                    return {
                        type: 'Distributor',
                        poRaisedToday: count || 0
                    };
                }

                //Retailers Black box
                if (checkUserType === 'Retailer') {
                    const count = await db.returnHeader.count({
                        where: {
                            returnFrom: ownerId,
                            returnDate: {
                                [db.Sequelize.Op.between]: [startOfDay, endOfDay],
                            }
                        }
                    })
                    return {
                        type: 'Retailer',
                        expiryRaisedToday: count || 0
                    };
                }

                return {
                    type: checkUserType || 'Unknown',
                    message: 'No metrics for this userType',
                };
            } catch (error) {
                console.error('❌ Error in blackBox:', error.message);
                return {
                    type: checkUserType || 'Unknown',
                    error: 'Internal Server Error',
                };
            }
        }

        async totalSalesToday(tokenData, startOfDay, endOfDay) {
            try {
                let ownerId = tokenData.id;
                if (tokenData?.userType === 'Employee') {
                    ownerId = tokenData.data.employeeOf;
                }

                // ---------- YESTERDAY ----------
                const startOfYesterday = new Date(startOfDay);
                startOfYesterday.setDate(startOfYesterday.getDate() - 1);
                const endOfYesterday = new Date(endOfDay);
                endOfYesterday.setDate(endOfYesterday.getDate() - 1);

                // ---------- TODAY ----------
                const todayOrderCount = await db.retailerSalesHeader.count({
                    where: {
                        retailerId: ownerId,
                        date: {
                            [Op.between]: [startOfDay, endOfDay]
                        }
                    }
                });

                // ---------- YESTERDAY ----------
                const yesterdayOrderCount = await db.retailerSalesHeader.count({
                    where: {
                        retailerId: ownerId,
                        createdAt: {
                            [Op.between]: [startOfYesterday, endOfYesterday]
                        }
                    }
                });

                // ---------- CALCULATION ----------
                let percentageChange = 0;
                if (yesterdayOrderCount > 0) {
                    percentageChange = ((todayOrderCount - yesterdayOrderCount) / yesterdayOrderCount) * 100;
                } else if (todayOrderCount > 0) {
                    percentageChange = 100;
                }

                return {
                    status: 200,
                    message: "Retailer sales orders count fetched successfully.",
                    data: {
                        salesOrdersToday: todayOrderCount,
                        yesterdayOrderCount: yesterdayOrderCount,
                        percentageChange: parseFloat(percentageChange.toFixed(2))
                    }
                };

            } catch (error) {
                console.error("Error in totalSalesToday:", error);
                return {
                    status: 500,
                    message: "Internal Server Error"
                };
            }
        }
        async totalPoRaisedToday(tokenData, startOfDay, endOfDay) {
            try {
                let ownerId = tokenData.id;
                if (tokenData?.userType === 'Employee') {
                    ownerId = tokenData.data.employeeOf;
                }

                // ---------- YESTERDAY ----------
                const startOfYesterday = new Date(startOfDay);
                startOfYesterday.setDate(startOfYesterday.getDate() - 1);
                const endOfYesterday = new Date(endOfDay);
                endOfYesterday.setDate(endOfYesterday.getDate() - 1);

                // ---------- TODAY ----------
                const todayPO = await db.orders.count({
                    where: {
                        orderFrom: ownerId,
                        orderDate: {
                            [Op.between]: [startOfDay, endOfDay]
                        }
                    }
                });

                // ---------- YESTERDAY ----------
                const yesterdayPO = await db.orders.count({
                    where: {
                        orderFrom: ownerId,
                        orderDate: {
                            [Op.between]: [startOfYesterday, endOfYesterday]
                        }
                    }
                });

                // ---------- CALCULATION ----------
                let percentageChange = 0;
                if (yesterdayPO > 0) {
                    percentageChange = ((todayPO - yesterdayPO) / yesterdayPO) * 100;
                } else if (todayPO > 0) {
                    percentageChange = 100;
                }

                return {
                    status: 200,
                    message: "Retailer Purchase orders count fetched successfully.",
                    data: {
                        todayPO: todayPO,
                        yesterdayPO: yesterdayPO,
                        percentageChange: parseFloat(percentageChange.toFixed(2))
                    }
                };

            } catch (error) {
                console.error("Error in totalPoRaisedToday:", error);
                return {
                    status: 500,
                    message: "Internal Server Error"
                };
            }
        }
        async poValueToday(tokenData, startOfDay, endOfDay) {
            try {
                let ownerId = tokenData.id;
                if (tokenData?.userType === 'Employee') {
                    ownerId = tokenData.data.employeeOf;
                }

                // ---------- YESTERDAY ----------
                const startOfYesterday = new Date(startOfDay);
                startOfYesterday.setDate(startOfYesterday.getDate() - 1);
                const endOfYesterday = new Date(endOfDay);
                endOfYesterday.setDate(endOfYesterday.getDate() - 1);

                // ---------- TODAY ----------
                const todayResult = await db.orderitems.findOne({
                    include: [
                        {
                            model: db.orders,
                            as: 'orders',
                            where: {
                                orderFrom: ownerId,
                                orderDate: {
                                    [Op.between]: [startOfDay, endOfDay]
                                }
                            },
                            attributes: []
                        }
                    ],
                    attributes: [
                        [db.Sequelize.literal('SUM(price * quantity)'), 'total']
                    ],
                    raw: true
                });

                const todayTotal = parseFloat(todayResult.total || 0);

                // ---------- YESTERDAY ----------
                const yesterdayResult = await db.orderitems.findOne({
                    include: [
                        {
                            model: db.orders,
                            as: 'orders',
                            where: {
                                orderFrom: ownerId,
                                orderDate: {
                                    [Op.between]: [startOfYesterday, endOfYesterday]
                                }
                            },
                            attributes: []
                        }
                    ],
                    attributes: [
                        [db.Sequelize.literal('SUM(price * quantity)'), 'total']
                    ],
                    raw: true
                });

                const yesterdayTotal = parseFloat(yesterdayResult.total || 0);

                // ---------- CALCULATION ----------
                let percentageChange = 0;
                if (yesterdayTotal > 0) {
                    percentageChange = ((todayTotal - yesterdayTotal) / yesterdayTotal) * 100;
                } else if (todayTotal > 0) {
                    percentageChange = 100;
                }

                return {
                    status: 200,
                    message: "Retailer Purchase Order value fetched successfully.",
                    data: {
                        todayPOValue: todayTotal,
                        yesterdayPOValue: yesterdayTotal,
                        percentageChange: parseFloat(percentageChange.toFixed(2))
                    }
                };

            } catch (error) {
                console.error("Error in poValueToday:", error);
                return {
                    status: 500,
                    message: "Internal Server Error"
                };
            }
        }
        async retailerPaymentCollected(tokenData, startOfDay, endOfDay){
            try{
                let ownerId = tokenData.id;
                if (tokenData?.userType === 'Employee') {
                    ownerId = tokenData.data.employeeOf;
                }

                console.log("Today start date", startOfDay);
                console.log("Today end date", endOfDay);

                // ----- YESTERDAY -----
                const startOfYesterday = new Date(startOfDay);
                startOfYesterday.setDate(startOfYesterday.getDate() - 1);
                console.log("yesterday start date", startOfYesterday);

                const endOfYesterday = new Date(endOfDay);
                endOfYesterday.setDate(endOfYesterday.getDate() - 1);
                console.log("yesterday end date", endOfYesterday);
                
                // --- Step 1: Get total amount for today ---
                const todayResult = await db.retailerSalesHeader.findAll({
                    where: {
                        retailerId: ownerId,
                        createdAt: {
                            [Op.between]: [startOfDay, endOfDay],
                        },
                    },
                    attributes: [
                        [db.Sequelize.fn('SUM', db.Sequelize.col('totalAmt')), 'totalAmountReceived'],
                    ],
                    raw: true,
                });

                const todayAmount = parseFloat(todayResult[0].totalAmountReceived) || 0;

                // --- Step 2: Get total amount for yesterday ---
                const yesterdayResult = await db.retailerSalesHeader.findAll({
                    where: {
                        retailerId: ownerId,
                        createdAt: {
                            [Op.between]: [startOfYesterday, endOfYesterday],
                        },
                    },
                    attributes: [
                        [db.Sequelize.fn('SUM', db.Sequelize.col('totalAmt')), 'totalAmountReceived'],
                    ],
                    raw: true,
                });

                const yesterdayAmount = parseFloat(yesterdayResult[0].totalAmountReceived) || 0;

                // --- Step 3: Calculate percentage change ---
                let percentageChange = 0;
                if (yesterdayAmount > 0) {
                    percentageChange = ((todayAmount - yesterdayAmount) / yesterdayAmount) * 100;
                } else if (todayAmount > 0) {
                    percentageChange = 100;
                }

                console.log(todayAmount);
                console.log(yesterdayAmount);
                return {
                    status: 200,
                    message: "Data fetched successfully.",
                    data: {
                        totalAmountReceivedToday: todayAmount,
                        percentageChange: Number(percentageChange.toFixed(2))
                    }
                };
                

            } catch (error) {
                console.error('Error in retailerPaymentCollected:', error);
                return {
                    status: 500,
                    message: error.message,
                };
            }
        }
        //So PO functions....end.................

    async getSlowMovingMedicines(tokenData, page = 1, limit = 10) {
        try {
            let ownerId = tokenData.id;
            let checkUserType = tokenData?.userType;
            if (tokenData.userType === 'Employee') {
                ownerId = tokenData.data.employeeOf;
                checkUserType = tokenData?.empOfType;
            }

            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

            if(checkUserType === "Retailer"){
                const headers = await db.retailerSalesHeader.findAll({
                    where: { retailerId: ownerId },
                    attributes: ['id'],
                    raw: true
                });

                const headerIds = headers.map(h => h.id);
                if (!headerIds.length) {
                    return {
                        status: 200,
                        message: "No orders found for this retailer.",
                        data: [],
                        pagination: { totalItems: 0, currentPage: page, limit, totalPages: 0 }
                    };
                }

                const details = await db.retailerSalesDetails.findAll({
                    where: {
                        headerId: { [Op.in]: headerIds },
                        createdAt: { [Op.gte]: thirtyDaysAgo }
                    },
                    include: [
                        {
                            model: db.products,
                            as: 'product',
                            attributes: ['PName'],
                            required: true
                        }
                    ],
                    attributes: ['PId', 'qty', 'createdAt'],
                    raw: true,
                    nest: true
                });

                const groupedMap = {};

                for (const item of details) {
                    const PId = item.PId;
                    const PName = item.product?.PName?.trim() || '';
                    const quantity = item.qty;
                    const createdAt = new Date(item.createdAt);

                    if (!groupedMap[PId]) {
                        groupedMap[PId] = {
                            PId,
                            PName,
                            quantity: 0,
                            latestOrderDate: createdAt
                        };
                    }

                    groupedMap[PId].quantity += quantity;

                    if (createdAt > groupedMap[PId].latestOrderDate) {
                        groupedMap[PId].latestOrderDate = createdAt;
                    }
                }

                const groupedArray = Object.values(groupedMap).sort((a, b) => a.quantity - b.quantity);

                const resultWithDays = groupedArray.map(item => {
                    const today = new Date();
                    const daysDifference = Math.floor((today - item.latestOrderDate) / (1000 * 60 * 60 * 24));
                    return {
                        ...item,
                        daysSinceOrder: daysDifference
                    };
                });

                const total = resultWithDays.length;
                const offset = (page - 1) * limit;
                const paginated = resultWithDays.slice(offset, offset + limit);

                return {
                    status: 200,
                    message: 'Ordered product quantities from the last 30 days fetched successfully',
                    pagination: {
                        totalItems: total,
                        currentPage: parseInt(page),
                        limit: parseInt(limit),
                        totalPages: Math.ceil(total / limit)
                    },
                    data: paginated,
                };                
                
            }
            else if(checkUserType === "Manufacturer" || checkUserType === "Distributor"){
                const orderedItems = await db.orders.findAll({
                    where: {
                        orderTo: ownerId,
                        orderDate: { [Op.gte]: thirtyDaysAgo }
                    },
                    include: [
                        {
                            model: db.orderitems,
                            as: 'orderItems',
                            required: true,
                            include: [
                                {
                                    model: db.products,
                                    as: 'products',
                                    attributes: ['PId', 'PName'],
                                    required: true
                                }
                            ],
                            attributes: ['PId', 'quantity']
                        }
                    ],
                    attributes: ['id', 'orderDate'],
                    raw: true,
                    nest: true
                });

                const groupedMap = {};

                for (const item of orderedItems) {
                    const PId = item.orderItems.PId;
                    const PName = item.orderItems.products.PName?.trim();
                    const quantity = item.orderItems.quantity;
                    const orderDate = new Date(item.orderDate);

                    if (!groupedMap[PId]) {
                        groupedMap[PId] = {
                            PId,
                            PName,
                            quantity: 0,
                            latestOrderDate: orderDate
                        };
                    }

                    groupedMap[PId].quantity += quantity;

                    if (orderDate > groupedMap[PId].latestOrderDate) {
                        groupedMap[PId].latestOrderDate = orderDate;
                    }
                }

                const groupedArray = Object.values(groupedMap).sort((a, b) => a.quantity - b.quantity);

                // Add the days difference calculation
                const resultWithDays = groupedArray.map(item => {
                    const today = new Date();
                    const daysDifference = Math.floor((today - item.latestOrderDate) / (1000 * 60 * 60 * 24)); // Convert milliseconds to days
                    return {
                        ...item,
                        daysSinceOrder: daysDifference
                    };
                });

                const total = resultWithDays.length;
                const offset = (page - 1) * limit;
                const paginated = resultWithDays.slice(offset, offset + limit);

                return {
                    status: 200,
                    message: 'Ordered product quantities from the last 30 days fetched successfully',
                    pagination: {
                        totalItems: total,
                        currentPage: parseInt(page),
                        limit: parseInt(limit),
                        totalPages: Math.ceil(total / limit)
                    },
                    data: paginated,
                };
            }

        } catch (error) {
            console.error('❌ Error in getSlowMovingMedicines:', error);
            return {
                status: 500,
                message: 'Internal Server Error',
                error: error.message
            };
        }
    }

    async getPatientsAndDoctors(tokenData, page = 1, limit = 10) {
        try {
            const ownerId = tokenData.id;
            if (tokenData.userType === "Employee") {
                ownerId = tokenData?.tokenData?.employeeOf
            }

            const totalPatientsAdded = await db.patients.count({
                where: { retailerId: ownerId }
            });

            const totalDoctorsAdded = await db.doctors.count({
                where: { retailerId: ownerId }
            });

            const headers = await db.retailerSalesHeader.findAll({
                where: { retailerId: ownerId },
                attributes: ['id', 'patientId', 'doctorId', 'totalAmt', 'createdAt'],
                include: [
                    {
                        model: db.patients,
                        as: 'patient',
                        attributes: ['name', 'mobile']
                    },
                    {
                        model: db.doctors,
                        as: 'doctor',
                        attributes: ['name', 'mobile', 'commission']
                    }
                ],
                order: [['createdAt', 'DESC']],
                raw: true
            });

            const seenPatients = new Map();
            const seenDoctors = new Map();

            for (const entry of headers) {
                const { patientId, doctorId, totalAmt, createdAt } = entry;

                // Process Patient
                if (patientId && !seenPatients.has(patientId)) {
                    seenPatients.set(patientId, {
                        id: patientId,
                        name: entry['patient.name'],
                        type: 'Patient',
                        mobile: entry['patient.mobile'],
                        lastPurchase: totalAmt,
                        purchasedDate: createdAt
                    });
                }

                console.log(doctorId);
                // Process Doctor
                if (doctorId) {
                    const doctor = seenDoctors.get(doctorId);
                    const commission = parseFloat(entry['doctor.commission']) || 0;
                    const commissionAmount = (totalAmt * commission) / 100;

                    if (!doctor) {
                        seenDoctors.set(doctorId, {
                            id: doctorId,
                            name: entry['doctor.name'],
                            type: 'Doctor',
                            mobile: entry['doctor.mobile'],
                            lastPurchase: totalAmt,
                            purchasedDate: createdAt,
                            commissionPercentage: commission,
                            commissionAmount: commissionAmount
                        });
                    } else {
                        // Add to total commissionAmount
                        doctor.commissionAmount += commissionAmount;

                        console.log(commissionAmount, doctor.commissionAmount);
                        // Update lastPurchase and date if this record is newer
                        if (new Date(createdAt) > new Date(doctor.purchasedDate)) {
                            doctor.lastPurchase = totalAmt;
                            doctor.purchasedDate = createdAt;
                        }

                        seenDoctors.set(doctorId, doctor);
                    }
                }
                console.log(entry);
            }

            // Combine both
            const allResults = [
                ...Array.from(seenPatients.values()),
                ...Array.from(seenDoctors.values()).map(doc => ({
                    ...doc,
                    commissionAmount: doc.commissionAmount.toFixed(2) // round off
                }))
            ];
            console.log(allResults, ';;;;;;')
            const totalRecords = allResults.length;
            const totalPages = Math.ceil(totalRecords / limit);
            const currentPage = parseInt(page);

            // Apply pagination
            // const paginatedResults = allResults.slice((page - 1) * limit, page * limit);

            return {
                status: 200,
                message: "Patient and Doctor data fetched successfully.",
                data: {
                    totalRecords,
                    totalPages,
                    currentPage,
                    totalPatientsAdded,
                    totalDoctorsAdded,
                    results: allResults
                }
            };

        } catch (error) {
            console.error("Error in getPatientsAndDoctors:", error);
            return {
                status: 500,
                message: "Internal Server Error"
            };
        }
    }

    async getTopPatients(tokenData) {
        try {

            let ownerId = tokenData.id;
            let checkUserType = tokenData.userType;

            if (tokenData?.userType === 'Employee') {
                checkUserType = tokenData.empOfType;
                ownerId = tokenData.data.employeeOf;
            }

            // Get total orders placed by this retailer
            const totalOrders = await db.retailerSalesHeader.count({
                where: { retailerId: ownerId }
            });

            // Get order count per patient with patient name, grouped and sorted
            const topPatientsData = await db.retailerSalesHeader.findAll({
                where: { retailerId: ownerId },
                attributes: [
                    'patientId',
                    [db.Sequelize.fn('COUNT', db.Sequelize.col('patientId')), 'orderCount']
                ],
                include: [
                    {
                        model: db.patients,
                        as: 'patient', // Use the correct alias set in the model
                        attributes: ['name']
                    }
                ],
                group: ['patientId', 'patient.id', 'patient.name'],
                order: [[db.Sequelize.literal('orderCount'), 'DESC']],
                raw: true
            });

            if (!topPatientsData || topPatientsData.length === 0) {
                return {
                    status: 400,
                    message: "No patient orders found for this retailer.",
                    data: { topPatients: [] }
                };
            }

            // Build result array with order percentage
            const topPatients = topPatientsData.map(patient => {
                const orderCount = parseInt(patient.orderCount);
                const percentage = totalOrders > 0 ? (orderCount / totalOrders) * 100 : 0;

                return {
                    patientId: patient.patientId,
                    name: patient['patient.name'],
                    orderCount: orderCount,
                    orderPercentage: parseFloat(percentage.toFixed(2))
                };
            });

            return {
                status: 200,
                message: "Top patients fetched successfully.",
                data: {
                    topPatients
                }
            };
        } catch (error) {
            console.error("Error in topPatients:", error);
            return {
                status: 500,
                message: "Internal server error while fetching top patients.",
                error: error.message
            };
        }
    }

}
module.exports = new distributorDashboard(db);