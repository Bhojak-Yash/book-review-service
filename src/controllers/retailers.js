// const db = require('../models/users')
const message = require('../helpers/message')
const { generateToken } = require('../middlewares/auth')
const db = require('../models/db')
const Users = db.users;
const Sequelize = db.sequelize;
const Op = db.Op;
const Pharmacy = db.retailers




exports.pharmacyDetails = async (req, res) => {
    try {
        const { pharmacyId } = req.query
        // const data = await Pharmacy.findOne({
        //     attributes: [
        //         'id',
        //         'pharmacyId',
        //         'registrationDate',
        //         'name',
        //         'address',
        //         'contactNumber',
        //         'latitude',
        //         'longitude',
        //         [Sequelize.fn('COUNT', Sequelize.col('orderdetails.id')), 'totalOrders'],
        //         [Sequelize.fn('SUM', Sequelize.col('orderdetails.totalAmount')), 'totalOrderAmount']
        //     ],
        //     where: {
        //         pharmacyId: pharmacyId
        //     },
        //     include: [
        //         {
        //             model: Orders,
        //             attributes: []
        //         }
        //     ],
        //     group: ['Pharmacy.id']
        // })

        const [data] = await Sequelize.query(`
            SELECT 
                p.CId AS pharmacyId,
                p.CreatedOn AS registrationDate,
                p.CName AS name,
                p.Add_1 AS address,
                p.TeleNo AS contactNumber,
                COUNT(DISTINCT ih.InvNo) AS totalOrders, -- Count unique invoices
                SUM(ih.Balance) AS totalOrderValue      -- Sum of Balance as total order value
            FROM 
                pharmacy p
            LEFT JOIN 
                invoice_header ih ON ih.CId = p.CId    -- Join on CId
            WHERE 
                p.CId = :cId                          -- Add the filter for CId
            GROUP BY 
                p.CId, p.CreatedOn, p.CName, p.Add_1, p.TeleNo
        `, {
            replacements: { cId: pharmacyId }, // Replace `pharmacyId` with the desired CId value
            type: Sequelize.QueryTypes.SELECT,
        });


        // console.log(data);

        res.json({
            status: message.code200,
            message: message.message200,
            apiData: data
        })
    } catch (error) {
        console.log(error.message)
        res.json({
            status: message.code500,
            message: message.message500,
            apiData: null
        })
    }
}

