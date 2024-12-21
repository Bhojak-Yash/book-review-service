// const db = require('../models/users')
const message = require('../helpers/message')
const { generateToken } = require('../middlewares/auth')
const db = require('../models/db')
const Users = db.users;
const Orders = db.orders;
const Items = db.items;
const Sequelize = db.sequelize;
const Op = db.Op;
const Pharmacy = db.pharmacies

exports.dashboard_details = async (req, res) => {
    try {
        const { startDate, endDate } = req.body;

        if (!startDate || !endDate) {
            return res.json({
                status: message.code400,
                message: 'Invalid input',
                apiData: null,
            });
        }

        // Parse startDate and endDate
        const parsedStartDate = new Date(startDate);
        parsedStartDate.setUTCHours(0, 0, 0, 0); // Start of the day in UTC

        const parsedEndDate = new Date(endDate);
        parsedEndDate.setUTCHours(23, 59, 59, 999); // End of the day in UTC

        console.log('Date Range:', parsedStartDate, parsedEndDate);
        const StartDate = new Date(startDate).toISOString().split('T')[0]; // 'YYYY-MM-DD'
        const EndDate = new Date(endDate).toISOString().split('T')[0];


        const result = await Sequelize.query(`
            SELECT 
                COALESCE(COUNT(ih.id), 0) AS totalCount,
                COALESCE(SUM(ih.Balance), 0) AS totalAmount
            FROM invoice_header ih
            WHERE DATE(ih.OrderDate) BETWEEN :StartDate AND :EndDate
        `, {
            replacements: { StartDate, EndDate },
            type: Sequelize.QueryTypes.SELECT, // Execute the query as a SELECT
        });
        

        // Fetch total pharmacies
        const totalPharmacy = await Sequelize.query(`
            SELECT COUNT(*) AS totalPharmacy
            FROM pharmacy WHERE DATE(createdOn) BETWEEN :StartDate AND :EndDate
        `, {
            replacements: { StartDate, EndDate },
            type: Sequelize.QueryTypes.SELECT, // Execute the query as a SELECT
        });
        const completedCount = await Sequelize.query(`
            SELECT 
                COALESCE(SUM(CASE WHEN DATE(end_dateTime) BETWEEN :StartDate AND :EndDate AND end_dateTime <= NOW() THEN 1 ELSE 0 END), 0) AS completedCount,
                COALESCE((SELECT COUNT(*) FROM pendingorders WHERE DATE(OrderDate) BETWEEN :StartDate AND :EndDate), 0) AS pendingCount
            FROM delivery_track
        `, {
            replacements: { StartDate, EndDate },
            type: Sequelize.QueryTypes.SELECT, // Execute the query as a SELECT
        });
        console.log(completedCount)
        // Access the count value
        const totalPharmacyCount = totalPharmacy[0].totalPharmacy;
        // console.log(result)
        // Extract data values
        const data = result[0] || {
            totalCount: 0,
            totalAmount: 0,
            pendingCount: 0,
        };

        // Return response
        return res.json({
            status: message.code200,
            message: message.message200,
            apiData: {
                totalOrders: Number(data.totalCount),
                totalAmount: Number(data.totalAmount),
                completedCount: Number(completedCount[0]?.completedCount),
                pendingCount: Number(completedCount[0]?.pendingCount),
                totalPharmacy: Number(totalPharmacy[0]?.totalPharmacy),
            },
        });
    } catch (error) {
        console.log('Dashboard error:', error.message);
        res.json({
            status: message.code500,
            message: message.message500,
        });
    }
}

exports.dashboard_graph = async (req, res) => {
    try {
        const { startDate, endDate } = req.body;

        if (!startDate || !endDate) {
            return res.json({
                status: message.code400,
                message: 'Invalid input',
                apiData: null,
            });
        }

        // Parse startDate and endDate
        const parsedStartDate = new Date(startDate);
        parsedStartDate.setUTCHours(0, 0, 0, 0); // Start of the day in UTC

        const parsedEndDate = new Date(endDate);
        parsedEndDate.setUTCHours(23, 59, 59, 999); // End of the day in UTC

        console.log('Date Range:', parsedStartDate, parsedEndDate);

        const result = await Sequelize.query(
            `
                SELECT 
                    COUNT(*) AS totalOrders,
                    SUM(CASE 
                        WHEN EXISTS (
                            SELECT 1 
                            FROM delivery_track dt 
                            WHERE dt.orderNumber = ih.InvNo 
                            AND dt.end_dateTime <= NOW()
                        ) THEN 1 
                        ELSE 0 
                    END) AS DeliveredCount,
                    SUM(CASE 
                        WHEN EXISTS (
                            SELECT 1 
                            FROM delivery_track dt 
                            WHERE dt.orderNumber = ih.InvNo 
                            AND dt.end_dateTime >= NOW()
                        ) AND NOT EXISTS (
                            SELECT 1
                            FROM delivery_track dt 
                            WHERE dt.orderNumber = ih.InvNo 
                            AND dt.end_dateTime <= NOW()
                        ) THEN 1 
                        ELSE 0 
                    END) AS OutForDeliveryCount,
                    SUM(CASE 
                        WHEN ih.Delivery_DateTime IS NOT NULL 
                             AND NOT EXISTS (
                                 SELECT 1 
                                 FROM delivery_track dt 
                                 WHERE dt.orderNumber = ih.InvNo 
                                 AND dt.end_dateTime <= NOW()
                             ) 
                             AND NOT EXISTS (
                                 SELECT 1
                                 FROM delivery_track dt 
                                 WHERE dt.orderNumber = ih.InvNo 
                                 AND dt.end_dateTime >= NOW()
                             ) THEN 1 
                        ELSE 0 
                    END) AS DispatchedCount,
                    SUM(CASE 
                        WHEN ih.EditUpdate > ih.CreatedOn THEN 1 
                        ELSE 0 
                    END) AS PreparingDispatchCount,
                    SUM(CASE 
                        WHEN ih.InvNo IS NOT NULL 
                             AND ih.Delivery_DateTime IS NULL 
                             AND NOT EXISTS (
                            SELECT 1 
                            FROM delivery_track dt 
                            WHERE dt.orderNumber = ih.InvNo
                        ) THEN 1 
                        ELSE 0 
                    END) AS BillGeneratedCount
                FROM 
                    invoice_header ih
                WHERE 
                    ih.OrderDate BETWEEN :startDate AND :endDate
            `,
            {
                replacements: {
                    startDate: parsedStartDate.toISOString(),
                    endDate: parsedEndDate.toISOString(),
                },
                type: Sequelize.QueryTypes.SELECT,
            }
        );
        
        console.log(result)
        res.json({
            status: message.code200,
            message: message.message200,
            apiData: result
        })
    } catch (error) {
        console.log('dashboard_graph error:', error.message)
        res.json({
            status: message.code500,
            message: message.message500,
            apiData: null
        })
    }
}

exports.sales_overview = async (req, res) => {
    try {
        const { year } = req.body;
        if (!year || isNaN(year)) {
            return res.json({
                status: message.code400,
                message: 'Invalid year input',
                apiData: null,
            });
        }

        console.log('Year:', year);

        const currentYearResults = await Sequelize.query(`
            SELECT 
                MONTH(dt.end_dateTime) AS month,
                COUNT(DISTINCT dt.id) AS totalDelivered, -- Count distinct deliveries
                SUM(IFNULL(ih.Balance, 0)) AS totalDeliveredAmount -- Use IFNULL to handle NULL values
            FROM 
                delivery_track dt
            LEFT JOIN 
                invoice_header ih ON ih.InvNo = dt.orderNumber -- Match delivery to invoice orders
            WHERE 
                dt.end_dateTime BETWEEN :startDate AND :endDate
                AND dt.end_dateTime <= NOW() -- Only include deliveries with end_dateTime <= NOW()
            GROUP BY 
                MONTH(dt.end_dateTime)
            ORDER BY 
                MONTH(dt.end_dateTime) ASC
        `, {
            replacements: {
                startDate: `${year}-01-01 00:00:00`,
                endDate: `${year}-12-31 23:59:59`
            },
            type: Sequelize.QueryTypes.SELECT, // Execute the query as a SELECT
        });
        const previousYearResults = await Sequelize.query(`
            SELECT 
                COUNT(DISTINCT ih.OrderNo) AS totalDelivered -- Count distinct orders with Delivery_DateTime
            FROM invoice_header ih
            WHERE ih.Delivery_DateTime IS NOT NULL -- Ensure delivered orders are included
            AND ih.OrderDate BETWEEN :startDate AND :endDate
        `, {
            replacements: {
                startDate: `${year - 1}-01-01 00:00:00`,
                endDate: `${year - 1}-12-31 23:59:59`
            },
            type: Sequelize.QueryTypes.SELECT, // Execute the query as a SELECT
        });
        
        const previousYearDelivered = parseInt(previousYearResults[0]?.totalDelivered || 0, 10);

        const completeData = Array.from({ length: 12 }, (_, i) => ({
            month: i + 1,
            totalDelivered: 0,
            totalDeliveredAmount: 0,
        }));

        currentYearResults.forEach((result) => {
            const monthIndex = result.month - 1;
            completeData[monthIndex].totalDelivered = parseInt(result.totalDelivered, 10) || 0;
            completeData[monthIndex].totalDeliveredAmount = parseFloat(result.totalDeliveredAmount) || 0;
        });

        const currentYearDelivered = currentYearResults.reduce(
            (sum, result) => sum + parseInt(result.totalDelivered, 10),
            0
        );

        const deliveredIncrease = currentYearDelivered - previousYearDelivered;

        res.json({
            status: message.code200,
            message: message.message200,
            apiData: {
                monthlyData: completeData,
                currentYearDelivered,
                previousYearDelivered,
                deliveredIncrease,
            },
        });
    } catch (error) {
        console.log('Error:', error.message);
        res.json({
            status: message.code500,
            message: message.message500,
            apiData: null,
        });
    }
}