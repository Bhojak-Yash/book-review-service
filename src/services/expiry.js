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
            if (data?.userType === 'Employee') {
                id = data.data.employeeOf
            }
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

    async expired_product_list(data) {
        try {
            let { page, limit, id } = data;
            if (data?.userType === 'Employee') {
                id = data.data.employeeOf
            }
            // console.log(id)
            page = page ? parseInt(page) : 1;
            limit = limit ? parseInt(limit) : 10;
            const offset = (page - 1) * limit;
            const daysforexpiry = Number(process.env.lowStockDays)
            const today = moment().startOf("day");
            const threeMonthsBefore = moment().subtract(daysforexpiry, "days").startOf("day").format("YYYY-MM-DD HH:mm:ss");
            const after90Days = moment().add(daysforexpiry, "days").startOf("day").format("YYYY-MM-DD HH:mm:ss");

            const { count, rows } = await db.stocks.findAndCountAll({
                attributes: [
                    "purchasedFrom",
                    // "PId",
                    [db.Sequelize.fn("COUNT", db.Sequelize.col("SId")), "totalStocks"],
                    [db.Sequelize.fn("SUM", db.Sequelize.col("Stock")), "totalSkus"],
                    [db.Sequelize.fn("SUM", db.Sequelize.literal("Stock * PTS")), "totalAmtPTS"],
                    [db.Sequelize.fn("SUM", db.Sequelize.literal("Stock * PTR")), "totalAmtPTR"]
                ],
                where: {
                    Stock: { [db.Sequelize.Op.gt]: 0 },
                    organisationId: Number(id),
                    [db.Sequelize.Op.and]: [
                        { ExpDate: { [db.Sequelize.Op.lt]: after90Days } },
                        { ExpDate: { [db.Sequelize.Op.gt]: threeMonthsBefore } }
                    ]
                },
                include: [
                    {
                        model: db.manufacturers,
                        as: "manufacturer",
                        attributes: ["companyName", "manufacturerId"],
                        required: false
                    },
                    {
                        model: db.distributors,
                        as: "distributor",
                        attributes: ["companyName", "distributorId"],
                        required: false
                    },
                    {
                        model: db.returnHeader,
                        as: "returnHeader",
                        attributes: ['returnId', 'returnDate'],
                        where: { returnFrom: Number(id), returnStatus: 'Pending' },
                        required: false
                    }
                ],
                limit,
                offset,
                // order: [["SId", "ASC"]],
                group: ["purchasedFrom", "returnHeader.returnId"]
            });

            const result = await rows?.map((item) => {
                const returnDate = item?.returnHeader ? item.returnHeader.returnDate : null
                console.log("......................", returnDate)
                return {
                    "returnToId": item.dataValues.purchasedFrom,
                    "totalStock": item.dataValues.totalStocks,
                    "totalSKU": item.dataValues.totalSkus,
                    "totalAmt": item.dataValues.totalAmtPTS,
                    "totalAmtPTR": item.dataValues.totalAmtPTR,
                    "returnTo": item.manufacturer ? item.manufacturer.companyName : item?.distributor?.companyName || null,
                    "returnStatus": item?.returnHeader ? "Pending" : "Not Returned",
                    "returnId": item?.returnHeader ? item?.returnHeader?.returnId : null,
                    "returnDate": item?.returnHeader ? item.returnHeader.returnDate : null
                }
            })

            return {
                status: message.code200,
                message: message.message200,
                totalData: count.length,
                totalPages: Math.ceil(count.length / limit),
                currentPage: page,
                apiData: result,
            }
        } catch (error) {
            console.log('expired_product_list service error:', error.message)
            return {
                status: message.code500,
                message: error.message
            }
        }
    }

    // async expire_details(data) {
    //     try {
    //         let { id, manufacturerId, page, limit, search } = data
    //         // console.log(data)
    //         if (data?.userType === 'Employee') {
    //             id = data.data.employeeOf
    //         }
    //         const returnTodata = await db.users.findOne({where:{id:Number(manufacturerId)}})
    //         page = page ? parseInt(page) : 1;
    //         limit = limit ? parseInt(limit) : 10;
    //         const offset = (page - 1) * limit;
    //         const checkId = Number(id)
    //         const daysforexpiry = Number(process.env.lowStockDays)
    //         const today = moment().startOf("day").format("YYYY-MM-DD HH:mm:ss")
    //         const threeMonthsBefore = moment().subtract(daysforexpiry, "days").startOf("day").format("YYYY-MM-DD HH:mm:ss");
    //         const after90Days = moment().add(daysforexpiry, "days").startOf("day").format("YYYY-MM-DD HH:mm:ss");
    //         const whereCondition = {
    //             organisationId: checkId,
    //             [db.Op.and]: [
    //                 { ExpDate: { [db.Op.lt]: after90Days } },
    //                 { ExpDate: { [db.Op.gt]: threeMonthsBefore } }
    //             ]
    //         };

    //         // Apply product filters only if searchKey is present
    //         const productWhereCondition = {};
    //         if (search && search.trim() !== "") {
    //             productWhereCondition[db.Op.or] = [
    //                 { PCode: { [db.Op.like]: `%${search}%` } },
    //                 { PName: { [db.Op.like]: `%${search}%` } },
    //                 { SaltComposition: { [db.Op.like]: `%${search}%` } }
    //             ];
    //         }
    //         const { count, rows: Data } = await db.stocks.findAndCountAll({
    //             attributes: ['SId', 'Stock', 'PId', 'ExpDate', 'PTS', 'PTR', 'MRP', 'BoxQty', 'location', 'Scheme'],
    //             where: whereCondition,
    //             include: [
    //                 {
    //                     model: db.products,
    //                     as: 'product',
    //                     attributes: ['PId', 'PName', 'PCode', 'manufacturerId', 'PackagingDetails', 'Package', 'ProductForm', 'Quantity', 'SaltComposition'],
    //                     // where:Object.keys(productWhereCondition).length ? productWhereCondition : undefined,
    //                     where: productWhereCondition,
    //                     required: true,
    //                     include: {
    //                         model: db.manufacturers,
    //                         as: 'manufacturer',
    //                         attributes: ['manufacturerId', 'companyName'],
    //                         where: { "manufacturerId": Number(manufacturerId) },
    //                         required: true
    //                     }
    //                 }
    //             ],
    //             limit,
    //             offset
    //         })
    //         const result = Data?.map((item) => {
    //             const currentDate = new Date();
    //             let expiryStatus = "Near Expiry";
    //             console.log(item.ExpDate, currentDate)
    //             if (item.ExpDate < currentDate) {
    //                 console.log('pppp')
    //                 expiryStatus = "Expired";
    //             }
    //             return {
    //                 "PName": item.product.PName,
    //                 'PCode': item.product.PCode,
    //                 "manufacturerId": item.product.manufacturer.manufacturerId,
    //                 "companyName": item.product.manufacturer.companyName,
    //                 "SId": item.SId,
    //                 "Scheme": item.Scheme,
    //                 "Stock": item.Stock,
    //                 "PId": item.PId,
    //                 "ExpDate": item.ExpDate,
    //                 "PTS": item.PTS,
    //                 "PTR": item.PTR,
    //                 "MRP": item.MRP,
    //                 "BoxQty": item.BoxQty,
    //                 "location": item.location,
    //                 "PackagingDetails": item.product.PackagingDetails,
    //                 "Package": item.product.Package,
    //                 "ProductForm": item.product.ProductForm,
    //                 "Quantity": item.product.Quantity,
    //                 "SaltComposition": item.product.SaltComposition,
    //                 expiryStatus
    //             }
    //         })
    //         return {
    //             totalData: count,
    //             totalPages: Math.ceil(count / limit),
    //             currentPage: page,
    //             apiData: result
    //         }
    //     } catch (error) {
    //         console.log('expire_details service error:', error.message)
    //         return {
    //             status: message.code500,
    //             message: error.message
    //         }
    //     }
    // }

    async expire_details(data) {
        try {
            let { id, manufacturerId, page, limit, search, expStatus } = data
            // console.log(data)
            if (data?.userType === 'Employee') {
                id = data.data.employeeOf
            }
            const returnTodata = await db.users.findOne({ where: { id: Number(manufacturerId) } })

            page = page ? parseInt(page) : 1;
            limit = limit ? parseInt(limit) : 10;
            const offset = (page - 1) * limit;
            const checkId = Number(id)
            const daysforexpiry = Number(process.env.lowStockDays)
            const today = moment().startOf("day").format("YYYY-MM-DD HH:mm:ss")
            const threeMonthsBefore = moment().subtract(daysforexpiry, "days").startOf("day").format("YYYY-MM-DD HH:mm:ss");
            const after90Days = moment().add(daysforexpiry, "days").startOf("day").format("YYYY-MM-DD HH:mm:ss");
            let whereCondition = {
                organisationId: checkId,
                purchasedFrom:Number(manufacturerId),
                Stock: {
                    [db.Op.gt]: 0
                },
                [db.Op.and]: [
                    { ExpDate: { [db.Op.lt]: after90Days } },
                    { ExpDate: { [db.Op.gt]: threeMonthsBefore } }
                ]
            };
            if (expStatus === "Expired"){
                whereCondition = {
                    organisationId: checkId,
                    purchasedFrom:Number(manufacturerId),
                    Stock: {
                        [db.Op.gt]: 0
                    },
                    [db.Op.and]: [
                        { ExpDate: { [db.Op.lt]: today } },
                        { ExpDate: { [db.Op.gt]: threeMonthsBefore } }                        
                    ]
                };
            } else if (expStatus === "NearToExpiry"){
                whereCondition = {
                    organisationId: checkId,
                    purchasedFrom:Number(manufacturerId),
                    Stock: {
                        [db.Op.gt]: 0
                    },
                    [db.Op.and]: [
                        { ExpDate: { [db.Op.lt]: after90Days } },
                        { ExpDate: { [db.Op.gt]: today } }
                    ]
                };
            }

            // Apply product filters only if searchKey is present
            const productWhereCondition = {};
            if (search && search.trim() !== "") {
                productWhereCondition[db.Op.or] = [
                    { PCode: { [db.Op.like]: `%${search}%` } },
                    { PName: { [db.Op.like]: `%${search}%` } },
                    { SaltComposition: { [db.Op.like]: `%${search}%` } }
                ];
            }
            if (data.startDate && data.endDate) {
                const startDate = moment(data.startDate, "DD-MM-YYYY").startOf("day").format("YYYY-MM-DD HH:mm:ss");
                const endDate = moment(data.endDate, "DD-MM-YYYY").endOf("day").format("YYYY-MM-DD HH:mm:ss");

                whereCondition.ExpDate = {
                    [db.Op.between]: [startDate, endDate]
                };
            }
            const { count, rows: Data } = await db.stocks.findAndCountAll({
                attributes: ['SId', 'Stock', 'PId', 'BatchNo', 'Loose', 'ExpDate', 'PTS', 'PTR', 'MRP', 'BoxQty', 'location', 'Scheme', 'organisationId'],
                where: whereCondition,
                include: [
                    {
                        model: db.products,
                        as: 'product',
                        attributes: ['PId', 'PName', 'PC`ode', 'manufacturerId', 'PackagingDetails', 'Package', 'ProductForm', 'Quantity', 'SaltComposition'],
                        // where:Object.keys(productWhereCondition).length ? productWhereCondition : undefined,
                        where: productWhereCondition,
                        required: true,
                        // include: {
                        //     model: db.manufacturers,
                        //     as: 'manufacturer',
                        //     attributes: ['manufacturerId', 'companyName'],
                        //     where: { "manufacturerId": Number(manufacturerId) },
                        //     required: true
                        // }
                    },
                    {
                        model: db.distributors,
                        as: 'distributor',
                        attributes: ['distributorId', 'companyName']
                    },
                    {
                        model: db.manufacturers,
                        as: "manufacturer",
                        attributes: ['manufacturerId', 'companyName']
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
                    "manufacturerId": item?.manufacturer?.manufacturerId || item?.distributor?.distributorId || null,
                    "companyName": item?.manufacturer?.companyName || item?.distributor?.companyName || null,
                    "SId": item.SId,
                    "Scheme": item.Scheme,
                    "BatchNo": item.BatchNo,
                    "loose": item.Loose,
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
                status: 200,
                message: "Data Fetched Successfully",
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
            let checkId = Number(id)
            if (data?.userType === 'Employee') {
                checkId = data.data.employeeOf
            }
            console.log("check Id...........", checkId);
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
                    [db.sequelize.fn("MAX", db.sequelize.col("stocks.updatedAt")), "updatedAt"],
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

            let lastUpdated = null;
            // console.log(Data)
            await Data?.forEach((item) => {
                // console.log(item.dataValues.unitCount)
                unitCount = unitCount + Number(item.dataValues.unitCount)
                totalExpiryValue = totalExpiryValue + Number(item.dataValues.totalExpiryValue)

                const updatedAt = item.dataValues.updatedAt;
                if (!lastUpdated || new Date(updatedAt) > new Date(lastUpdated)) {
                    lastUpdated = updatedAt;
                }
                // console.log("updatedAt: ", lastUpdated);
            })
            return {
                status: message.code200,
                message: message.message200,
                // Data,
                unitCount,
                totalExpiryValue,
                totalSKU,
                lastUpdated: moment(lastUpdated).add(5, 'hours').add(30, 'minutes').toISOString()
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
            const { returnTo, items, returnTotal, id } = data
            let userId = Number(id)
            if (data?.userType === 'Employee') {
                userId = data.data.employeeOf
            }
            if (!returnTo || !userId || !items || !returnTotal) {
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
                "returnTo": Number(returnTo),
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
            let { page, limit, search, startDate, endDate } = data
            let id = data?.id
            if(data?.userType === "Employee"){
                id = data?.data?.employeeOf
            }
            // console.log(data)
            if (data?.userType === 'Employee') {
                id = data.data.employeeOf
            }
            const Page = Number(data.page) || 1;
            const Limit = Number(data.limit) || 10;
            let skip = (Page - 1) * Limit;
            const userId = Number(id)
            const whereClause = {returnTo: userId };

            // Required condition: returnTo or returnFrom must match userId
            const baseUserCondition = {
                
            };
            
            const andConditions = [baseUserCondition];
            
            // Optional search filter
            if (search) {
              whereClause[db.Op.or]= [
                  { returnId: { [db.Op.like]: `%${search}%` } },
                  { '$returnFromUser.companyName$': { [db.Op.like]: `%${search}%` } }
                ]
            }
            
            // Optional date range filter
            if (startDate && endDate) {
              andConditions.push({
                returnDate: {
                  [db.Op.between]: [startDate, endDate]
                }
              });
            }
            
            // Assign final AND clause to whereClause
            // whereClause[db.Op.and] = andConditions;            

            console.log(whereClause)
            const { count, rows: Data } = await db.returnHeader.findAndCountAll({
                attributes: ['returnId', 'returnFrom', 'returnTo', 'returnAmt', 'returnTotal', 'returnStatus', 'returnDate'],
                where: whereClause,
                include: [
                    {
                        model: db.distributors,
                        as: 'returnFromUser',
                        attributes: ['companyName', 'distributorId'],
                        required: false,
                    },
                    {
                        model: db.retailers,
                        as: 'returnByUser',
                        attributes: ['retailerId', 'firmName'],
                        required: false
                    }
                ],
                order:[['returnId','desc']],
                offset: skip,
                limit: Limit,
            });

            const result = await Data?.map((item) => {
                return {
                    "returnId": item.returnId,
                    "returnFrom": item.returnFrom,
                    "returnTo": item.returnTo,
                    "returnAmt": item.returnAmt,
                    "returnTotal": item.returnTotal,
                    "returnStatus": item.returnStatus,
                    "returnDate": item.returnDate,
                    "returnFromUser": item?.returnFromUser?.companyName || item?.returnByUser?.firmName,
                }
            })

            return {
                status: message.code200,
                message: message.message200,
                totalData: count,
                totalPages: Math.ceil(count / Limit),
                currentPage: Page,
                apiData: result
            }
        } catch (error) {
            console.log('expiry_return_list service error:', error.message)
            return {
                status: message.code500,
                message: error.message
            }
        }
    }

    async returned_list(data) {
        try {
            let { id, page, limit, search, startDate, endDate } = data
            // console.log(data)
            if (data?.userType === 'Employee') {
                id = data.data.employeeOf
            }
            const Page = Number(data.page) || 1;
            const Limit = Number(data.limit) || 10;
            let skip = (Page - 1) * Limit;
            const userId = Number(id)
            const whereClause = {returnFrom: userId };

            // Required condition: returnTo or returnFrom must match userId
            // const baseUserCondition = {
                
            // };
            
            // const andConditions = [baseUserCondition];
            
            // Optional search filter
            if (search) {
              andConditions.push({
                [db.Op.or]: [
                  { returnId: { [db.Op.like]: `%${search}%` } },
                  { '$returnFromUser.companyName$': { [db.Op.like]: `%${search}%` } }
                ]
              });
            }
            
            // Optional date range filter
            if (startDate && endDate) {
              andConditions.push({
                returnDate: {
                  [db.Op.between]: [startDate, endDate]
                }
              });
            }
            
            // Assign final AND clause to whereClause
            // whereClause[db.Op.and] = andConditions;            

            console.log(whereClause)
            const { count, rows: Data } = await db.returnHeader.findAndCountAll({
                attributes: ['returnId', 'returnFrom', 'returnTo', 'returnAmt', 'returnTotal', 'returnStatus', 'returnDate'],
                where: whereClause,
                include: [
                    {
                        model: db.distributors,
                        as: 'returnToUser',
                        attributes: ['companyName', 'distributorId'],
                        required: false,
                    },
                    {
                        model: db.manufacturers,
                        as: 'returnToMan',
                        attributes: ['manufacturerId', 'companyName'],
                        required: false
                    }
                ],
                order:[['returnId','desc']],
                offset: skip,
                limit: Limit,
            });

            const result = await Data?.map((item) => {
                return {
                    "returnId": item.returnId,
                    "returnFrom": item.returnFrom,
                    "returnTo": item.returnTo,
                    "returnAmt": item.returnAmt,
                    "returnTotal": item.returnTotal,
                    "returnStatus": item.returnStatus,
                    "returnDate": item.returnDate,
                    "returnFromUser": item?.returnToUser?.companyName || item?.returnToMan?.firmName,
                }
            })

            return {
                status: message.code200,
                message: message.message200,
                totalData: count,
                totalPages: Math.ceil(count / Limit),
                currentPage: Page,
                apiData: result
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
            const { status, returnId, returnAmt, items, reason, cnUrl, returnFrom, returnTo } = data
            const Reason = reason || ""
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
                if (cnUrl, returnAmt, returnFrom, returnTo) {
                    await db.creditNotes.upsert({
                        "amount": Number(returnAmt),
                        "issuedBy": Number(returnTo),
                        "issuedTo": Number(returnFrom),
                        "url": cnUrl,
                        "isSettled": false,
                        "returnId": returnId,
                        "balance": Number(returnAmt)
                    },
                        { transaction }
                    )
                }
            } else {
                await db.returnHeader.update(
                    { returnStatus: status, reason: Reason },
                    { where: { returnId: Number(returnId) } },
                    { transaction }
                )
            }

            await transaction.commit();
            return {
                status: message.code200,
                message: `Return request successfully ${status}`
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
            let { id, returnId } = data
            if (data?.userType === 'Employee') {
                id = data.data.employeeOf
            }
            const Data = await db.returnHeader.findOne({
                attributes: ['returnId', 'returnDate', 'returnFrom', 'returnTo', 'returnStatus'],
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
                    },
                    {
                        model: db.retailers,
                        as: 'returnByUser',
                        attributes: ['retailerId', 'firmName'],
                        required: false
                    },
                    {
                        model: db.creditNotes,
                        as: "creditnote",
                        attributes: ['id', 'createdAt', 'url']
                    }
                ]
            })
            const result = {
                "returnId": Data.returnId,
                "returnDate": Data.returnDate,
                "returnFrom": Data.returnFrom,
                "returnTo": Data.returnTo,
                "returnStatus": Data.returnStatus,
                "returnFromUser": Data?.returnFromUser?.companyName || Data?.returnByUser?.firmName || null,
                "returnDetails": Data.returnDetails,
                "creditnote": Data?.creditnote
            }

            return {
                status: message.code200,
                message: message.message200,
                apiData: result
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
            const {startDate, endDate } = data
            let id = data?.id
            if(data?.userType === "Employee"){
                id = data?.data?.employeeOf
            }
            const userId = Number(id)
            if (data?.userType === 'Employee') {
                id = data.data.employeeOf
            }
            let wherereturn = {
                returnFrom: Number(userId),
            }
            let wherecn = {
                organisationId: Number(userId)
            }
            let wherecnv = {
                returnFrom: Number(userId)
            }
            if (startDate && endDate) {
                const formattedStartDate = startDate.split("-").reverse().join("-") + " 00:00:00";
                const formattedEndDate = endDate.split("-").reverse().join("-") + " 23:59:59";
                wherereturn.returnDate = {
                    [db.Op.between]: [formattedStartDate, formattedEndDate]
                };
                wherecn.createdAt = {
                    [db.Op.between]: [formattedStartDate, formattedEndDate]
                };
                wherecnv.returnDate = {
                    [db.Op.between]: [formattedStartDate, formattedEndDate]
                };
            }
            const daysforexpiry = Number(process.env.lowStockDays)
            const [Returns] = await db.returnHeader.findAll({
                attributes: [
                    [db.Sequelize.fn("COUNT", db.Sequelize.col("returnId")), "totalReturnRaised"],
                    [db.Sequelize.fn("SUM", db.Sequelize.literal("CASE WHEN returnStatus = 'Confirmed' THEN 1 ELSE 0 END")), "confirmedCount"],
                    [db.Sequelize.fn("SUM", db.Sequelize.literal("CASE WHEN returnStatus = 'Pending' THEN 1 ELSE 0 END")), "pendingCount"]
                ],
                where: wherereturn
            });
            const [creditnote] = await db.stocks.findAll({
                attributes: [
                    [db.sequelize.fn("SUM", db.sequelize.literal("CASE WHEN ExpDate < CURDATE() THEN 1 ELSE 0 END")), "ExpiredCount"],
                    [db.sequelize.fn("SUM", db.sequelize.literal(`CASE WHEN ExpDate BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL ${daysforexpiry} DAY) THEN 1 ELSE 0 END`)), "ExpiringSoonCount"]
                ],
                where: wherecn
            });
            const [cnvalues] = await db.returnHeader.findAll({
                attributes: [
                    [db.Sequelize.fn("SUM", db.Sequelize.col("returnTotal")), "totalReturnTotal"], // Total returnTotal (all statuses)
                    [db.Sequelize.fn("SUM", db.Sequelize.literal("CASE WHEN returnStatus = 'Pending' THEN returnTotal ELSE 0 END")), "pendingReturnTotal"], // Sum of returnTotal for Pending
                    [db.Sequelize.fn("SUM", db.Sequelize.literal("CASE WHEN returnStatus = 'Confirmed' THEN cNAmt ELSE 0 END")), "confirmedCNAmt"] // Sum of cNAmt for Confirmed
                ],
                where: wherecnv
            });
            return {
                status: message.code200,
                message: message.message200,
                Returns: {
                    totalReturnRaised: String(Returns?.dataValues?.totalReturnRaised ?? 0),
                    confirmedCount: String(Returns?.dataValues?.confirmedCount ?? 0),
                    pendingCount: String(Returns?.dataValues?.pendingCount ?? 0)
                },
                creditnote: {
                    ExpiredCount: String(creditnote?.dataValues?.ExpiredCount ?? 0),
                    ExpiringSoonCount: String(creditnote?.dataValues?.ExpiringSoonCount ?? 0)
                },
                cnvalues: {
                    totalReturnTotal: String(cnvalues?.dataValues?.totalReturnTotal ?? 0),
                    pendingReturnTotal: String(cnvalues?.dataValues?.pendingReturnTotal ?? 0),
                    confirmedCNAmt: String(cnvalues?.dataValues?.confirmedCNAmt ?? 0)
                }
            };

        } catch (error) {
            console.log('expiry_list_card_data service error:', error.message)
            return {
                status: message.code500,
                messagae: error.messagae
            }
        }
    }

    async get_credit_notes(data) {
        try {
            const { id } = data
            let userId = id
            const Data = await db.creditNotes.findAll({ where: { issuedTo: Number(userId) } })
            return {
                status: message.code200,
                message: message.message200,
                apiData: Data || []
            }
        } catch (error) {
            console.log('get_credit_note service error:', error.message)
            return {
                status: message.code500,
                message: message.message500
            }
        }
    }

    async redeem_cn(data) {
        try {
            const { id, creditnoteId } = data
            if (!creditnoteId) {
                return {
                    status: message.code400,
                    message: 'Invalid input'
                }
            }
            const creditNote = await db.creditNotes.findOne({ where: { id: Number(creditnoteId) } })
            // console.log(creditNote?.isSettled)
            if (!creditNote) {
                return {
                    status: message.code400,
                    message: 'Invalid credit note'
                }
            } else if (creditNote?.isSettled) {
                return {
                    status: message.code400,
                    message: 'Credit note already reedmed'
                }
            }
            let remainingCredit = creditNote?.dataValues?.amount;
            const orders = await db.orders.findAll({
                where: {
                    orderFrom: id,
                    orderStatus: { [db.Sequelize.Op.in]: ["Inward", "Partially paid"] },
                },
                order: [["id", "ASC"]],
            });
            if (!orders.length) {
                return {
                    status: message.code400,
                    message: "No valid orders found to apply the credit note",
                };
            }
            const updatedOrders = [];

            for (const order of orders) {
                if (remainingCredit <= 0) break; // Stop if credit is exhausted

                let orderBalance = order.balance;

                if (orderBalance > 0) {
                    let amountToPay = Math.min(orderBalance, remainingCredit);

                    orderBalance -= amountToPay;
                    remainingCredit -= amountToPay;

                    let newStatus = orderBalance === 0 ? "Paid" : "Partially paid";

                    await order.update({
                        balance: orderBalance,
                        orderStatus: newStatus
                    });

                    updatedOrders.push({
                        orderId: order.id,
                        paidAmount: amountToPay,
                        remainingOrderBalance: orderBalance,
                        newStatus,
                    });
                }
            }

            await db.creditNotes.update({ isSettled: true }, { where: { id: Number(creditnoteId) } })

            return {
                status: message.code200,
                message: "Credit note successfully applied to orders",
                creditNoteId: creditnoteId,
                remainingCredit,
                updatedOrders,
            };
            // return {
            //     status:message.code200,
            //     message:message.message200,
            //     creditNote
            // }
        } catch (error) {
            console.log('redeem_cn service error:', error.message)
            return {
                status: message.code500,
                message: error.message
            }
        }
    }

}


module.exports = new expiryService(db);
