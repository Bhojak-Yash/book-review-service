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
            const users = await db.distributors.findAll()
            const userIds = users.map((item) => { return item?.distributorId })
            const aaa = await Promise.all(
                userIds?.map(async (item) => {
                    const sss = await salesOpening(item, startDate, endDate);
                    const zzz = await purchaseOpening(item, startDate, endDate);
                    // console.log(item, sss);
                    return {sss,zzz};
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
        console.log('salesOpening error:', error.message)
        return null
    }
}

module.exports = new DoctorsService(db);
