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
                        attributes: ['returnId'],
                        where: { returnFrom: Number(id), returnStatus: 'Pending' },
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
                    returnToId: item.manufacturerId,
                    totalSKU: item?.products?.length,
                    totalStock: item?.products?.reduce((stockSum, product) => {
                        return stockSum + product.stocks?.reduce((sum, stock) => sum + stock.Stock, 0);
                    }, 0),
                    totalAmt: item?.products?.reduce((stockSum, product) => {
                        return stockSum + product.stocks?.reduce((sum, stock) => sum + (Number(stock.Stock) * Number(stock.PTS)), 0);
                    }, 0),
                    returnStatus: item?.returnHeader.length ? "Pending" : "Not Returned",
                    returnId: item?.returnHeader.length ? item?.returnHeader[0]?.returnId : null
                };
            });

            return {
                status: message.code200,
                message: message.message200,
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

    async expire_details(data) {
        try {
            let { id, manufacturerId, page, limit, search } = data
            // console.log(data)
            page = page ? parseInt(page) : 1;
            limit = limit ? parseInt(limit) : 10;
            const offset = (page - 1) * limit;
            const checkId = Number(id)
            const daysforexpiry = Number(process.env.lowStockDays)
            const today = moment().startOf("day").format("YYYY-MM-DD HH:mm:ss")
            const threeMonthsBefore = moment().subtract(daysforexpiry, "days").startOf("day").format("YYYY-MM-DD HH:mm:ss");
            const after90Days = moment().add(daysforexpiry, "days").startOf("day").format("YYYY-MM-DD HH:mm:ss");
            const whereCondition = {
                organisationId: checkId,
                [db.Op.and]: [
                    { ExpDate: { [db.Op.lt]: after90Days } },
                    { ExpDate: { [db.Op.gt]: threeMonthsBefore } }
                ]
            };

            // Apply product filters only if searchKey is present
            const productWhereCondition = {};
            if (search && search.trim() !== "") {
                productWhereCondition[db.Op.or] = [
                    { PCode: { [db.Op.like]: `%${search}%` } },
                    { PName: { [db.Op.like]: `%${search}%` } },
                    { SaltComposition: { [db.Op.like]: `%${search}%` } }
                ];
            }
            const { count, rows: Data } = await db.stocks.findAndCountAll({
                attributes: ['SId', 'Stock', 'PId', 'ExpDate', 'PTS', 'PTR', 'MRP', 'BoxQty', 'location', 'Scheme'],
                where: whereCondition,
                include: [
                    {
                        model: db.products,
                        as: 'product',
                        attributes: ['PId', 'PName', 'PCode', 'manufacturerId', 'PackagingDetails', 'Package', 'ProductForm', 'Quantity', 'SaltComposition'],
                        // where:Object.keys(productWhereCondition).length ? productWhereCondition : undefined,
                        where: productWhereCondition,
                        required: true,
                        include: {
                            model: db.manufacturers,
                            as: 'manufacturer',
                            attributes: ['manufacturerId', 'companyName'],
                            where: { "manufacturerId": Number(manufacturerId) },
                            required: true
                        }
                    }
                ],
                limit,
                offset
            })
            const result = Data?.map((item) => {
                const currentDate = new Date();
                let expiryStatus = "Near Expiry";
                console.log(item.ExpDate, currentDate)
                if (item.ExpDate < currentDate) {
                    console.log('pppp')
                    expiryStatus = "Expired";
                }
                return {
                    "PName": item.product.PName,
                    'PCode': item.product.PCode,
                    "manufacturerId": item.product.manufacturer.manufacturerId,
                    "companyName": item.product.manufacturer.companyName,
                    "SId": item.SId,
                    "Scheme": item.Scheme,
                    "Stock": item.Stock,
                    "PId": item.PId,
                    "ExpDate": item.ExpDate,
                    "PTS": item.PTS,
                    "PTR": item.PTR,
                    "MRP": item.MRP,
                    "BoxQty": item.BoxQty,
                    "location": item.location,
                    "PackagingDetails": item.product.PackagingDetails,
                    "Package": item.product.Package,
                    "ProductForm": item.product.ProductForm,
                    "Quantity": item.product.Quantity,
                    "SaltComposition": item.product.SaltComposition,
                    expiryStatus
                }
            })
            return {
                totalData: count,
                totalPages: Math.ceil(count / limit),
                currentPage: page,
                apiData: result
            }
        } catch (error) {
            console.log('expire_details service error:', error.message)
            return {
                status: message.code500,
                message: error.message
            }
        }
    }

    async expire_details_card_data(data) {
        try {
            const { id, manufacturerId } = data
            const checkId = Number(id)
            const daysforexpiry = Number(process.env.lowStockDays)
            const today = moment().startOf("day");
            const threeMonthsBefore = moment().subtract(daysforexpiry, "days").startOf("day").format("YYYY-MM-DD HH:mm:ss");
            const after90Days = moment().add(daysforexpiry, "days").startOf("day").format("YYYY-MM-DD HH:mm:ss");

            let unitCount = 0;
            let totalExpiryValue = 0;
            const Data = await db.stocks.findAll({
                attributes: [
                    [db.sequelize.fn("SUM", db.sequelize.col("Stock")), "unitCount"],
                    [db.sequelize.fn("SUM", db.sequelize.literal("Stock * PTS")), "totalExpiryValue"],
                    "PId"
                ],
                include: [
                    {
                        model: db.products,
                        as: "product",
                        required: true,
                        attributes: ['PId'],
                        where: { manufacturerId: Number(manufacturerId) }
                    }
                ],
                where: {
                    organisationId: checkId,
                    [db.Op.and]: [
                        { ExpDate: { [db.Op.lt]: after90Days } },
                        { ExpDate: { [db.Op.gt]: threeMonthsBefore } }
                    ]
                },
                group: ["stocks.PId"]
            });

            const totalSKU = await db.stocks.count({
                distinct: true,
                col: "PId",
                include: [
                    {
                        model: db.products,
                        as: "product",
                        required: true,
                        where: { manufacturerId: Number(manufacturerId) }
                    }
                ],
                where: {
                    organisationId: checkId,
                    [db.Op.and]: [
                        { ExpDate: { [db.Op.lt]: after90Days } },
                        { ExpDate: { [db.Op.gt]: threeMonthsBefore } }
                    ]
                }
            });
            // console.log(Data)
            await Data?.forEach((item) => {
                // console.log(item.dataValues.unitCount)
                unitCount = unitCount + Number(item.dataValues.unitCount)
                totalExpiryValue = totalExpiryValue + Number(item.dataValues.totalExpiryValue)
            })
            return {
                status: message.code200,
                message: message.message200,
                // Data,
                unitCount,
                totalExpiryValue,
                totalSKU
            }
        } catch (error) {
            console.log('expire_details_card_data service error:', error.message)
            return {
                status: message.code500,
                message: message.message500
            }
        }
    }

    async raise_expiry(data) {
        let transaction;
        try {
            transaction = await db.sequelize.transaction();
            const { manufacturerId, items, returnTotal, id } = data
            let userId = Number(id)
            if (!manufacturerId || !userId || !items || !returnTotal) {
                return {
                    status: message.code400,
                    message: 'Invalid input'
                }
            }
            const header = await db.returnHeader.create({
                "returnDate": new Date(),
                "returnTotal": Number(returnTotal),
                "balance": Number(returnTotal),
                "returnFrom": userId,
                "returnTo": Number(manufacturerId),
                "returnStatus": "Pending"
            },
                { transaction }
            )

            const insertData = [];

            items?.forEach((item, index) => {
                if (!item.SId || !item.PId || !item.BoxQty || !item.Stock) {
                    throw new Error(`Missing required fields in items at index ${index}`);
                }

                insertData.push({
                    "returnId": header.returnId,
                    "SId": Number(item.SId),
                    "PId": Number(item.PId),
                    "BoxQty": Number(item.BoxQty),
                    "quantity": Number(item.Stock)
                });
            });
            await db.returnDetails.bulkCreate(insertData, { transaction })
            // console.log(insertData, ';;;;;;;;;;;')
            await transaction.commit();
            return {
                status: message.code200,
                message: message.message200,
                apiData: header
            }
        } catch (error) {
            if (transaction) await transaction.rollback();
            console.log('raise_expiry service error:', error.message)
            return {
                status: message.code500,
                message: error.message
            }
        }
    }

    async expiry_return_list(data) {
        try {
            let { id, page, limit, search, startDate, endDate } = data
            console.log(data)
            page = page ? parseInt(page) : 1;
            limit = limit ? parseInt(limit) : 10;
            const offset = (page - 1) * limit;
            const userId = Number(id)

            const whereClause = {
                returnTo: userId,
            };

            if (search) {
                whereClause[db.Op.or] = [
                    { returnId: { [db.Op.like]: `%${search}%` } },
                    { '$returnFromUser.companyName$': { [db.Op.like]: `%${search}%` } }
                ];
            }

            if (startDate && endDate) {
                whereClause.returnDate = {
                    [db.Op.between]: [startDate, endDate]
                };
            }

            const { count, rows: Data } = await db.returnHeader.findAndCountAll({
                attributes: ['returnId', 'returnFrom', 'returnTo', 'returnAmt', 'returnTotal', 'returnStatus', 'returnDate'],
                where: whereClause,
                include: [
                    {
                        model: db.distributors,
                        as: 'returnFromUser',
                        attributes: ['companyName', 'distributorId'],
                        required: false,
                    }
                ],
                limit,
                offset,
            });

            return {
                status: message.code200,
                message: message.message200,
                totalData: count,
                totalPages: Math.ceil(count / limit),
                currentPage: page,
                apiData: Data
            }
        } catch (error) {
            console.log('expiry_return_list service error:', error.message)
            return {
                status: message.code500,
                message: error.message
            }
        }
    }

    async update_expiry_return(data) {
        let transaction;
        try {
            transaction = await db.sequelize.transaction();
            const { status, returnId, returnAmt, items } = data
            if (!status || !returnId) {
                return {
                    status: message.code400,
                    message: 'Invalid input'
                }
            }
            if (status == 'Confirmed') {
                if (!items || !returnAmt) {
                    return {
                        status: message.code400,
                        message: 'Invalid input'
                    }
                }
                const caseQuery = items.map(item => `WHEN id = ${item.id} THEN ${item.quantity}`).join(' ');

                const ids = items.map(item => item.id).join(',');

                await db.sequelize.query(`
                      UPDATE return_details 
                      SET quantity = CASE ${caseQuery} END
                      WHERE id IN (${ids});
                      `,
                      { transaction }
                    );
                const SIds = items.map(item => item.SId)
                await db.stocks.update(
                    { Stock: 0 },
                    { where: { SId: { [db.Op.in]: SIds } } },
                    { transaction }
                );
                await db.returnHeader.update(
                    { returnAmt: Number(returnAmt), confirmationDate: new Date(), cNAmt: Number(returnAmt), returnStatus: 'Confirmed' },
                    { where: { returnId: Number(returnId) } },
                    { transaction }
                )
            } else {
                await db.returnHeader.update(
                    { returnStatus: status },
                    { where: { returnId: Number(returnId) } },
                    { transaction }
                )
            }
            await transaction.commit();
            return {
                status:message.code200,
                message:`Return request successfully ${status}`
            }
        } catch (error) {
            if (transaction) await transaction.rollback();
            console.log('update_expiry_return service error:', error.message)
            return {
                status: message.code500,
                message: error.message
            }
        }
    }

    async returned_details(data) {
        try {
            const { id, returnId } = data
            const Data = await db.returnHeader.findOne({
                attributes: ['returnId', 'returnDate', 'returnFrom', 'returnTo'],
                where: { returnId: Number(returnId) },
                include: [
                    {
                        model: db.returnDetails,
                        as: "returnDetails",
                        attributes: ['PId', 'SId', 'BoxQty', 'Stock', 'quantity', 'id'],
                        include: [
                            {
                                model: db.products,
                                as: 'products',
                                attributes: ['PId', 'PName', 'SaltComposition']
                            },
                            {
                                model: db.stocks,
                                as: "stocks",
                                attributes: ['BatchNo', 'ExpDate', 'MRP', 'PTS', 'Scheme']
                            }
                        ]
                    },
                    {
                        model: db.distributors,
                        as: 'returnFromUser',
                        attributes: ['companyName', 'distributorId']
                    }
                ]
            })

            return {
                status: message.code200,
                message: message.message200,
                apiData: Data
            }
        } catch (error) {
            console.log('returned_details servie error:', error.messagae)
            return {
                status: message.code500,
                message: error.message
            }
        }
    }

    async expiry_list_card_data(data) {
        try {
            const { id } = data
            const userId = Number(id)
            // const Data = await db.
        } catch (error) {
            console.log('expiry_list_card_data service error:', error.message)
            return {
                status: message.code500,
                messagae: error.messagae
            }
        }
    }

}

module.exports = new expiryService(db);
