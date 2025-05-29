const message = require('../helpers/message');
const db = require('../models/db');
const { Parser } = require('json2csv');

class TallyReportsService {
    constructor(db) {
        this.db = db;
    }

    async partwise_outstanding_report(data, res) {
        try {
            let { id, userType } = data
            let usercheckType = 'distributors'
            if (userType === 'Employee') {
                id = data.data.employeeOf
                usercheckType = data.empOfType || 'distributors'
            }
            if (userType === 'Distributor') {
                usercheckType = 'Retailers'
            }

            // console.log(data)
            // const Data = await db.distributors.findAll({
            //     attributes:['distributorId','companyName','distributorCode'],
            //     include:[
            //         {
            //             model:db.orders,
            //             as:"orders",
            //             attributes:[]
            //         }
            //     ]
            // })
            let includeTable = [
                {
                    model: db.distributors,
                    as: 'fromDistributor',
                    attributes: ['distributorId', 'companyName', 'distributorCode'],
                    required: true
                }
            ]
            if (usercheckType == 'Retailers') {
                includeTable = [
                    {
                        model: db.retailers,
                        as: 'fromRetailer',
                        attributes: ['retailerId', 'firmName', 'retailerCode'],
                        include: true
                    }
                ]
            }
            const Data = await db.orders.findAll({
                where: {
                    orderTo: Number(id)
                },
                attributes: [
                    'orderFrom',
                    [db.Sequelize.fn('COUNT', db.Sequelize.col('id')), 'totalOrders'],
                    [db.Sequelize.fn('SUM', db.Sequelize.col('invAmt')), 'totalInvoiceAmount'],
                    [db.Sequelize.fn('SUM', db.Sequelize.col('balance')), 'totalBalance']
                ],
                include: includeTable,
                group: ['orderFrom'],
                raw: false
            });

            const returnData = Data?.map((item) => {
                return {
                    "PartyName": item?.fromDistributor?.companyName || item?.fromRetailer?.firmName,
                    "PartyCode": item?.fromDistributor?.distributorCode || item?.fromRetailer?.retailerCode,
                    "PartyId": item?.fromDistributor?.distributorId || item?.fromRetailer?.retailerId,
                    "NumberOfOrders": item?.dataValues?.totalOrders || 0,
                    "TotalOrderValue": item?.dataValues?.totalInvoiceAmount || 0,
                    "TotalOutstanding": item?.dataValues?.totalBalance || 0
                }
            })
            // const returnData = [];

            // for (let i = 1; i <= 100000; i++) {
            //     const isDistributor = i % 2 === 0;
            //     returnData.push({
            //         PartyName: isDistributor ? `Distributor ${i}` : `Retailer ${i}`,
            //         PartyCode: isDistributor ? `D-${i}` : `R-${i}`,
            //         PartyId: i,
            //         NumberOfOrders: Math.floor(Math.random() * 50),
            //         TotalOrderValue: (Math.random() * 10000).toFixed(2),
            //         TotalOutstanding: (Math.random() * 5000).toFixed(2)
            //     });
            // }
            const fields = ['PartyName', 'PartyCode', 'NumberOfOrders', 'TotalOrderValue', 'TotalOutstanding'];
            const json2csvParser = new Parser({ fields });
            const csv = json2csvParser.parse(returnData);

            // Send as downloadable CSV
            res.header('Content-Type', 'text/csv');
            res.attachment('party_outstanding_report.csv');
            return res.send(csv);
            // return { returnData }
        } catch (error) {
            console.log('partwise_outstanding_report service error:', error.message)
            return {
                status: message.code500,
                message: error.message
            }
        }
    }

}

module.exports = new TallyReportsService(db);
