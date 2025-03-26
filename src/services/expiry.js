const message = require('../helpers/message');
const db = require('../models/db');
const moment = require("moment");

class expiryService {
    constructor(db) {
        this.db = db;
    }

    async expire_product_list(data) {
        // try {
        //     const {id} = data
        //     const {count,rows} = await db.stocks.findAndCountAll({
        //         attributes:['SId','PId','BatchNo','ExpDate','MRP','PTR','PTS','Stock'],
        //         include:[
        //             {
        //                 model:db.products,
        //                 as:"product",
        //                 attributes:['PId','PName'],
        //                 required:true
        //             }
        //         ]
        //     })
        //     return {
        //         status:message.code200,
        //         message:message.message200,
        //         apiData:rows
        //     }
        // } 
        try {
            let { page, limit, id } = data;
            // console.log(id)
            page = page ? parseInt(page) : 1;
            limit = limit ? parseInt(limit) : 10;
            const offset = (page - 1) * limit;
            const daysforexpiry = Number(process.env.lowStockDays)
            const today = moment().startOf("day"); 
            const threeMonthsBefore = moment().subtract(daysforexpiry, "days").startOf("day").format("YYYY-MM-DD HH:mm:ss");
            const after90Days = moment().add(daysforexpiry, "days").startOf("day").format("YYYY-MM-DD HH:mm:ss");
            // console.log(threeMonthsBefore,after90Days)
            const { count, rows } = await db.manufacturers.findAndCountAll({
                attributes: ["manufacturerId", "companyName"],
                include: [
                    {
                        model: db.products,
                        as: "products",
                        attributes: ["PId", "PName"],
                        include: [
                            {
                                model: db.stocks,
                                as: "stocks",
                                attributes: ["SId", "organisationId", 'PTS', 'PTR', 'Stock', 'ExpDate'],
                                where: {
                                    Stock: { [db.Sequelize.Op.gt]: 0 },
                                    organisationId: Number(id),
                                    [db.Op.and]: [
                                        { ExpDate: { [db.Op.lt]: after90Days } },
                                        { ExpDate: { [db.Op.gt]: threeMonthsBefore } }
                                    ]
                                },
                                required: true
                            }
                        ],
                        required: true
                    },
                    {
                        model: db.returnHeader,
                        as: "returnHeader",
                        attributes: ['id'],
                        where: { returnFrom: Number(id),returnStatus:'Pending' },
                        required: false
                    }
                ],
                distinct: true,
                limit,
                offset,
                order: [["companyName", "ASC"]],
            })

            const result = rows?.map((item) => {
                return {
                    returnTo: item?.companyName,
                    returnToId:item.manufacturerId,
                    totalSKU: item?.products?.length,
                    totalStock: item?.products?.reduce((stockSum, product) => {
                        return stockSum + product.stocks?.reduce((sum, stock) => sum + stock.Stock, 0);
                    }, 0),
                    totalAmt: item?.products?.reduce((stockSum, product) => {
                        return stockSum + product.stocks?.reduce((sum, stock) => sum + (Number(stock.Stock) * Number(stock.PTS)), 0);
                    }, 0),
                    returnStatus: item?.returnHeader.length ? "Pending" : "Not Returned"
                };
            });

            return {
                totalManufacturers: count,
                totalPages: Math.ceil(count / limit),
                currentPage: page,
                manufacturers: result
            }
        } catch (error) {
            console.log('expire_product_list service error:', error.message)
            return {
                status: message.code500,
                message: message.message500
            }
        }
    }

}

module.exports = new expiryService(db);
