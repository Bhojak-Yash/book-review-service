const message = require('../helpers/message');
const db = require('../models/db');
const { Op } = require('sequelize');
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
            // console.log(tokenData, "..............................................");
            if (tokenData?.userType === 'Employee') {
                ownerId = tokenData.data.employeeOf;
            }
            if (!db.stocks) {
                throw new Error('Stocks model is not loaded correctly');
            }

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
        } catch (error) {
            console.error('distProductInfo service error:', error.message);
            return {
                status: message.code500,
                message: message.message500,
            };
        }
    }

    async distributorRequest(tokenData, statusFilter = '',page=1,limit=10) {
        try {
            let ownerId = tokenData.id;
            let Page = Number(page)
            let Limit = Number(limit)

            if (tokenData?.userType === 'Employee'){
                ownerId = tokenData.data.employeeOf;
            }
            let skip = 0
            if(Page>1){
                skip = Number(Page-1)*Number(Limit)
            }
            let whereClause ={authorizedBy: Number(ownerId)}
// console.log(page,limit,skip)
            const validStatuses = ['Pending', 'Approved', 'Rejected'];
            // if (statusFilter !== 'All' && !validStatuses.includes(statusFilter)) {
            //     throw new Error('Invalid status filter provided');
            // }
            if(statusFilter && statusFilter != 'All'){
                whereClause.status=statusFilter
            }

            console.log('OwnerId:', ownerId,whereClause);
            // console.log('Status Filter Applied:', statusFilter !== 'All' ? statusFilter : 'No Filter');

            // Fetch authorized distributors & retailers in a single query
            const {rows:authorizedEntities,count} = await db.authorizations.findAndCountAll({
                where: whereClause,
                attributes: ['authorizedId', 'status'],
                include: [
                    {
                        model: db.distributors,
                        as: 'distributors',
                        attributes: [
                            'distributorId', 'companyName', 
                            'address','phone','profilePic' ,'createdAt'
                        ]
                    },
                    {
                        model: db.retailers,
                        as: 'retailers',
                        attributes: [
                            'retailerId', 'firmName', 
                            'address', 'phone','profilePic' ,'createdAt'
                        ]
                    },
                    // {
                    //     model:db.address,
                    //     as:'address',
                    //     attributes:['addLine1','city'],
                    //     where:{addressType:"Business"}
                    // }
                ],
                raw: true,
                offset:skip,
                limit:Limit
            });
// console.log(count,'ppppppppppp')
            const retailersApproved = authorizedEntities.map(entity => {
                const createdAt = entity['distributors.createdAt'] || entity['retailers.createdAt'];
                const daysSinceCreated = createdAt
                  ? Math.floor((new Date().getTime() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24))
                  : null;
              
                return {
                  authorizedId: entity['distributors.distributorId'] || entity['retailers.retailerId'],
                  companyName: entity['distributors.companyName'] || entity['retailers.firmName'],
                  address: entity['address.addLine1'] || entity['address.addLine1'],
                  city: entity['address.city'] || entity['address.city'],
                  phone: entity['distributors.phone'] || entity['retailers.phone'],
                  status: entity.status,
                  profilePic: entity['distributors.profilePic'] || entity['retailers.profilePic'],
                  createdAt,
                  daysSinceCreated,
                };
            });


            // console.log('Retailers Approved:', authorizedEntities);
        
            return {
                status: message.code200,
                message: retailersApproved.length ? message.message200 : 'No authorized retailers or distributors found',
                totalItem:count,
                totalPage:Math.ceil(count/Number(limit)),
                currentPage:Number(page),
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

            if (tokenData.userType === 'Employee') {
                ownerId = tokenData.data.employeeOf;
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

            if (tokenData.userType === 'Employee') {
                ownerId = tokenData.data.employeeOf;
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

    async topDistributors(tokenData) {
        try {
            let ownerId = tokenData.id;
            if (tokenData.userType === 'Employee') {
                ownerId = tokenData.data.employeeOf;
            }

            console.log(`Fetching Top Distributors for Owner ID: ${ownerId}`);

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

            // Step 3: Fetch top distributors for the latest month
            const results = await db.orders.findAll({
                attributes: [
                    'orderFrom',
                    [db.Sequelize.col('distributer.companyName'), 'companyName'],
                    [db.Sequelize.fn('SUM', db.Sequelize.col('invAmt')), 'total_invAmt']
                ],
                include: [
                    {
                        model: db.distributors,
                        as: 'distributer',
                        attributes: []
                    }
                ],
                where: {
                    orderTo: ownerId,
                    createdAt: { [db.Sequelize.Op.between]: [startDate, endDate] }
                },
                group: ['orderFrom', 'distributer.companyName'],
                having: db.Sequelize.literal('total_invAmt > 0'),
                order: [[db.Sequelize.literal('total_invAmt'), 'DESC']],
                raw: true
            });

            console.log("Distributors Data Before Percentage Calculation:", results);

            // Step 4: Calculate percentage of total invoice amount
            const distributorsWithPercentage = results.map(distributor => ({
                ...distributor,
                percentage: ((distributor.total_invAmt / totalInvAmt) * 100).toFixed(2) + "%"
            }));

            console.log("Distributors Data After Percentage Calculation:", distributorsWithPercentage);

            return {
                status: message.code200,
                message: message.message200,
                apiData: distributorsWithPercentage
            };
        } catch (error) {
            console.error("❌ Error in topDistributors:", error);
            return {
                status: message.code500,
                message: message.message500
            };
        }
    }






}

module.exports = new distributorDashboard(db);