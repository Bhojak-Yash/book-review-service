// const db = require('../models/users')
const message = require('../helpers/message')
const { generateToken } = require('../middlewares/auth')
const db = require('../models/db')
const Users = db.users;
const Orders = db.orders;
const Items = db.items;
const Sequelize = db.sequelize;
const Op = db.Op;
const Pharmacy = db.pharmacies;

exports.getorders = async (req, res) => {
    try {
        const { date, page, search } = req.body;

        // Format the input date for filtering
        const inputDate = date ? new Date(date).toISOString().split('T')[0] : null;
        
        // Construct dynamic WHERE clause for SQL query
        const whereConditions = [];
        if (inputDate) {
            whereConditions.push(`ih.OrderDate BETWEEN '${inputDate}T00:00:00' AND '${inputDate}T23:59:59'`);
        }
        if (search) {
            whereConditions.push(`(
                ih.InvNo LIKE '%${search}%' OR 
                p.CName LIKE '%${search}%'
            )`);
        }
        
        // Combine WHERE conditions
        const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';
        // Pagination
        const limit = 20;
        const offset = page ? (Number(page) - 1) * limit : 0;
        // SQL Query
        const [dd] = await Sequelize.query(`
            SELECT 
                ih.id,
                ih.OrderNo,
                ih.OrderDate,
                ih.InvNo,
                ih.Balance,
                ih.CId,
                p.CName,
                p.Add_1, -- Include the Add_1 column
                CASE 
                    WHEN EXISTS (
                        SELECT 1
                        FROM delivery_track dt
                        WHERE dt.orderNumber = ih.InvNo 
                    ) THEN 
                        CASE 
                            WHEN (
                                SELECT dt.end_dateTime 
                                FROM delivery_track dt
                                WHERE dt.orderNumber = ih.InvNo 
                                LIMIT 1
                            ) <= NOW() THEN 'Delivered'
                            ELSE 'Out for Delivery'
                        END
                    WHEN ih.Delivery_DateTime IS NOT NULL THEN 'Goods Dispatched'
                    WHEN ih.EditUpdate > ih.CreatedOn THEN 'Preparing Dispatch'
                    WHEN ih.InvNo IS NOT NULL THEN 'Bill Generated'
                    ELSE 'Pending'
                END AS Status
            FROM 
                invoice_header ih
            LEFT JOIN 
                pharmacy p ON p.CId = ih.CId
            ${whereClause} -- Dynamic WHERE clause
            ORDER BY ih.OrderDate DESC -- Optional: order by date or other columns
            LIMIT ${limit} OFFSET ${offset} -- Pagination
        `);
        // return res.json(dd)
        
        const [result] = await Sequelize.query(`
            SELECT COUNT(*) AS totalCount
            FROM invoice_header ih
            LEFT JOIN pharmacy p ON p.CId = ih.CId
            ${whereClause}
        `, {
            replacements: {
                search: `%${search}%`,  // Safely passing the search term
            },
            type: Sequelize.QueryTypes.SELECT,  // Specify it's a SELECT query
        });
        console.log(result)
        const countAll = result.totalCount;
        const totalPage = Math.ceil(countAll/limit)
// console.log(data,countAll,inputDate,whereClause)
        res.json({
            status: message.code200,
            message: message.message200,
            currentPage:Number(page),
            totalPage:totalPage,
            apiData: dd
        })
    } catch (error) {
        console.log(error)
        res.json({
            status: message.code500,
            message: message.message500
        })
    }
}

exports.getOrderDetails = async (req,res) => {
    try {
        const {orderId } = req.query
        console.log(orderId)
        if(!orderId){
            res.json({
                status:message.code400,
                message:message.message400
            })
        }
      
        const { invNo } = req.body;  // Assuming `invNo` is passed in the API payload

       const result = await Sequelize.query(`
    SELECT 
        ih.OrderDate,
        ih.id,
        ih.Delivery_DateTime,
        ih.CId,
        ih.InvNo,
        ih.Balance,
        p.CName,
        p.Area,
        p.TeleNo,
        id.OrderNo,
        id.BatchNo,
        id.Qty,
        id.GrsAmt,
        prod.PName,  -- Join Products table to get PName
        CASE 
            WHEN EXISTS (
                SELECT 1
                FROM delivery_track dt
                WHERE dt.orderNumber = ih.InvNo
                  AND dt.end_dateTime <= NOW()
            ) THEN 'Delivered'
            WHEN EXISTS (
                SELECT 1
                FROM delivery_track dt
                WHERE dt.orderNumber = ih.InvNo
                  AND dt.end_dateTime > NOW()
            ) THEN 'Out for Delivery'
            WHEN ih.Delivery_DateTime IS NOT NULL THEN 'Goods Dispatched'
            WHEN ih.EditUpdate > ih.CreatedOn THEN 'Preparing Dispatch'
            WHEN ih.InvNo IS NOT NULL THEN 'Bill Generated'
            ELSE 'Pending'
        END AS orderStatus
    FROM 
        invoice_header ih
    LEFT JOIN 
        pharmacy p ON p.CId = ih.CId
    LEFT JOIN 
        invDetails id ON id.InvNo = ih.InvNo
    LEFT JOIN 
        Products prod ON prod.PId = id.PId  -- Join Products table to get PName
    WHERE 
        ih.InvNo = :invNo
`, {
    replacements: {
        invNo: orderId,  // Passing the invoice number from the API payload
    },
    type: Sequelize.QueryTypes.SELECT,  // Execute the query as a SELECT
});

console.log(result);

const resultGrouped = result?.reduce((acc, item) => {
    // Find the item for the same invNo, if already exists
    const existingInvoice = acc.find(i => i.invoiceNumber === item.InvNo);
    
    if (existingInvoice) {
        // Add the invDetails (OrderNo, BatchNo, Qty, and PName) to the existing invoice object
        existingInvoice.invDetails.push({
            OrderNo: item.OrderNo,
            BatchNo: item.BatchNo,  // Adding BatchNo
            PName: item.PName,  // Adding PName from the Products table
            quantity: item.Qty,
            GrsAmt: item.GrsAmt,  // Adding GrsAmt from the invDetails table
        });
    } else {
        // If it's a new invNo, create a new object and push it
        acc.push({
            OrderDate: item.OrderDate,
            id: item.id,
            DeliveryDate: item.Delivery_DateTime,
            pharmacyId: item.CId,
            invoiceNumber: item.InvNo,
            Balance: item.Balance,
            pharmacyName: item.CName,
            address: item.Area,
            contactNumber: item.TeleNo,
            orderStatus: item.orderStatus,
            invDetails: [
                {
                    OrderNo: item.OrderNo,
                    BatchNo: item.BatchNo,  // Adding BatchNo
                    PName: item.PName,  // Adding PName from the Products table
                    quantity: item.Qty,
                    GrsAmt: item.GrsAmt,  // Adding GrsAmt from the invDetails table
                },
            ],
        });
    }
    return acc;
}, []);

// console.log(resultGrouped);

        
// resultGrouped now contains the invoice with an array of invDetails for each invNo
// console.log(resultGrouped);  // This will give you the grouped result


        // return res.json(resultGrouped)
        let orderCount = 0
        if(resultGrouped){
            const [orderCountt] = await Sequelize.query(`
                SELECT COUNT(DISTINCT InvNo) AS orderCount
                FROM invDetails
                WHERE CId = :pharmacyId
                  AND InvDate >= NOW() - INTERVAL 30 DAY
            `, {
                replacements: {
                    pharmacyId: resultGrouped[0]?.pharmacyId,  // Replace with the actual pharmacyId
                },
                type: Sequelize.QueryTypes.SELECT,
            });
            // console.log(resultGrouped[0]?.pharmacyId)
            orderCount =orderCountt.orderCount
    }
        res.json({
            status:message.code200,
            message:message.message200,
            last30daysorders:orderCount,
            apiData:resultGrouped[0]
        })
    } catch (error) {
       console.log('getOrderDetails error:',error.message)
       res.json({
        status:message.code500,
        message:message.message500,
        apiData:null
       }) 
    }
}

