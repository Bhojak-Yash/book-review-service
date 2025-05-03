const message = require('../helpers/message');
const db = require('../models/db');
const Op = db.Op
const moment = require("moment");


class DoctorsService {
    constructor(db) {
        this.db = db;
    }

    async sales_report(data) {
        try {
            const { id, start_date, end_date } = data
            const startDate = moment(start_date, "DD-MM-YYYY").startOf("day").format("YYYY-MM-DD HH:mm:ss");
            const endDate = moment(end_date, "DD-MM-YYYY").endOf("day").format("YYYY-MM-DD HH:mm:ss");
            const users = await db.distributors.findAll({
                attributes:['distributorId','email']
            })
            // const userIds = users.map((item) => { return item?.distributorId })
            const aaa = await Promise.all(
                users?.map(async (item) => {
                    const sales = await salesOpening(item?.distributorId, startDate, endDate);
                    const purchase = await purchaseOpening(item?.distributorId, startDate, endDate);
                    const totalSales = await totalSlaes(item?.distributorId, startDate, endDate);
                    const totalpurchase = await totalPurchase(item?.distributorId, startDate, endDate);
                    const collections = await totalCollections(item?.distributorId, startDate, endDate);
                    const totalPayout = await totalPayouts(item?.distributorId, startDate, endDate);
                    const stocksReports = await stocksReport(item?.distributorId, startDate, endDate);
                    // console.log(item, sss);
                    const id=item?.distributorId
                    return {id ,sales, purchase, totalSales, totalpurchase,collections,totalPayout,stocksReports };
                })
            );

            return aaa;
        } catch (error) {
            console.log('sales_report service error:', error.message)
            return {
                status: message.code500,
                message: error.message
            }
        }
    }


}

const salesOpening = async (id, startDate, endDate) => {
    try {
        const salesOpening = await db.orders.findOne({
            attributes: ['id', 'confirmationDate', 'invNo'],
            where: {
                orderTo: Number(id), confirmationDate: { [db.Op.not]: null },
                confirmationDate: {
                    [Op.between]: [startDate, endDate]
                }
            },
            order: [['id', 'asc']]
        })
        const salesClosing = await db.orders.findOne({
            attributes: ['id', 'confirmationDate', 'invNo'],
            where: {
                orderTo: Number(id), confirmationDate: { [db.Op.not]: null },
                confirmationDate: {
                    [Op.between]: [startDate, endDate]
                }
            },
            order: [['id', 'desc']]
        })

        return {
            salesOpening, salesClosing
        }
    } catch (error) {
        console.log('salesOpening error:', error.message)
        return null
    }
}
const purchaseOpening = async (id, startDate, endDate) => {
    try {
        const purchaseOpening = await db.orders.findOne({
            attributes: ['id', 'orderDate', 'invNo'],
            where: {
                orderFrom: Number(id),
                //  confirmationDate: { [db.Op.not]: null },
                confirmationDate: {
                    [Op.between]: [startDate, endDate]
                }
            },
            order: [['id', 'asc']]
        })
        const purchaseClosing = await db.orders.findOne({
            attributes: ['id', 'orderDate', 'invNo'],
            where: {
                orderFrom: Number(id),
                //  confirmationDate: { [db.Op.not]: null },
                confirmationDate: {
                    [Op.between]: [startDate, endDate]
                }
            },
            order: [['id', 'desc']]
        })

        return {
            purchaseOpening, purchaseClosing
        }
    } catch (error) {
        console.log('purchaseOpening error:', error.message)
        return null
    }
}
const totalSlaes = async (id, startDate, endDate) => {
    try {
        const total = await db.orders.sum('invAmt', {
            where: {
                orderTo: id,
                orderStatus:{[db.Op.notIn]:['Rejected','Cancelled']},
                confirmationDate: {
                    [Op.between]: [startDate, endDate]
                }
            }
        });

        return total || 0;
    } catch (error) {
        console.log('totalSlaes error:', error.message)
        return null
    }
}
const totalPurchase = async (id, startDate, endDate) => {
    try {
        const total = await db.orders.sum('invAmt', {
            where: {
                orderFrom: id,
                orderStatus:{[db.Op.notIn]:['Rejected','Cancelled']},
                confirmationDate: {
                    [Op.between]: [startDate, endDate]
                }
            }
        });
        return total || 0;
    } catch (error) {
        console.log('totalPurchase error:', error.message)
        return null
    }
}
const totalCollections = async (id, startDate, endDate) => {
        try {
            const total = await db.payments.sum('amount', {
                include: [{
                    model: db.orders,
                    as: 'order',
                    attributes: [], // prevent including order.id and others
                    where: {
                        orderTo: id,
                        createdAt: {
                            [Op.between]: [startDate, endDate]
                        }
                    }
                }],
                where: {
                    status: 'Confirmed'
                },
                raw: true // ensures plain SQL result
            });
            

            return total || 0; // return 0 if no payments found

        } catch (error) {
            console.log('totalCollections error:', error.message)
            return null
        }
}
const totalPayouts = async (id, startDate, endDate) => {
    try {
        const total = await db.payments.sum('amount', {
            include: [{
                model: db.orders,
                as: 'order',
                attributes: [], // prevent including order.id and others
                where: {
                    orderFrom: id,
                    createdAt: {
                        [Op.between]: [startDate, endDate]
                    }
                }
            }],
            where: {
                status: 'Confirmed'
            },
            raw: true // ensures plain SQL result
        });
        

        return total || 0; // return 0 if no payments found

    } catch (error) {
        console.log('totalCollections error:', error.message)
        return null
    }
}
const stocksReport = async (id,startDate,endDate) => {
    try {
        const data = await db.stocks.sum('Stock',{
            where:{
                organisationId:Number(id)
            }
        })
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);

        const todayEnd = new Date();
        todayEnd.setHours(23, 59, 59, 999);

        const existingReport = await db.stocksReport.findOne({
            where: {
                userId: Number(id),
                createdAt: {
                    [Op.between]: [todayStart, todayEnd]
                }
            }
        });

        if (existingReport) {
            await existingReport.update({ closingStock: Number(data) });
        } else {
            await db.stocksReport.create({
                userId: Number(id),
                openingStock: Number(data)
            });
        }
        return data
    } catch (error) {
        console.log('stocksReport error:',error.message)
        return null
    }
}

module.exports = new DoctorsService(db);
