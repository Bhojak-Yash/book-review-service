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
            const { start_date, end_date } = data
            const startDate = moment(start_date, "DD-MM-YYYY").startOf("day").format("YYYY-MM-DD HH:mm:ss");
            const endDate = moment(end_date, "DD-MM-YYYY").endOf("day").format("YYYY-MM-DD HH:mm:ss");
            const users = await db.distributors.findAll({
                attributes: ['distributorId', 'email', 'companyName'],
                where: { mailstats: true }
            })
            // console.log(startDate,endDate,data,';;;;;;;;;;;;;;;;;;;;;;;')
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
                    const id = item?.distributorId
                    // console.log(purchase,';;;;',id);
                    // return {id ,sales, purchase, totalSales, totalpurchase,collections,totalPayout,stocksReports };
                    return {
                        userId: id,
                        companyName: item?.companyName,
                        email: item?.email,
                        salesOpeningTime: sales?.salesOpening?.confirmationDate || null,
                        salesOpeningInv: sales?.salesOpening?.invNo || null,
                        salesClosingTime: sales?.salesClosing?.confirmationDate || null,
                        salesClosingInv: sales?.salesClosing?.invNo || null,
                        purchaseOpeningTime: purchase?.purchaseOpening?.orderDate || null,
                        purchaseOpeningInv: purchase?.purchaseOpening?.invNo || null,
                        purchaseClosingTime: purchase?.purchaseClosing?.orderDate || null,
                        purchaseClosingInv: purchase?.purchaseClosing?.invNo || null,
                        totalSales: totalSales,
                        totalpurchase: totalpurchase,
                        collections: collections,
                        totalPayout: totalPayout,
                        openingStocks: stocksReports?.openingStocks || 0,
                        closingStocks: stocksReports?.closingStocks || 0
                    }
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

    // async stocksReport(startDate,endDate){
    //     try {
    //         const users = await db.users.findAll({
    //             attributes:['id','userType'],
    //             // where:{userType:{[db.Op.in]:['Manufacturer','Distributor']}}
    //         })
    //         console.log(users)
    //        await users?.map(async(item)=>{
    //         const data = await db.stocks.sum('Stock',{
    //             where:{
    //                 organisationId:Number(item.id)
    //             }
    //         })
    //         const todayStart = new Date();
    //         todayStart.setHours(0, 0, 0, 0);

    //         const todayEnd = new Date();
    //         todayEnd.setHours(23, 59, 59, 999);

    //         const existingReport = await db.stocksReport.findOne({
    //             where: {
    //                 userId: Number(item.id),
    //                 createdAt: {
    //                     [Op.between]: [todayStart, todayEnd]
    //                 }
    //             }
    //         });

    //         if (existingReport) {
    //             await existingReport.update({ closingStock: Number(data) });
    //         } else {
    //             await db.stocksReport.create({
    //                 userId: Number(item.id),
    //                 openingStock: Number(data)
    //             });
    //         }
    //        })
    //         return true
    //     } catch (error) {
    //         console.log('stocksReport error:',error.message)
    //         return null
    //     }
    // }

    async stocksReport(startDate, endDate) {
        try {
            const users = await db.users.findAll({
                attributes: ['id', 'userType'],
                // where: { userType: { [db.Sequelize.Op.in]: ['Manufacturer', 'Distributor'] } }
            });

            const todayStart = new Date();
            todayStart.setHours(0, 0, 0, 0);

            const todayEnd = new Date();
            todayEnd.setHours(23, 59, 59, 999);

            for (const user of users) {
                const orgId = Number(user.id);

                const totalStock = await db.stocks.sum('Stock', {
                    where: {
                        organisationId: orgId
                    }
                });

                const existingReport = await db.stocksReport.findOne({
                    where: {
                        userId: orgId,
                        createdAt: {
                            [db.Sequelize.Op.between]: [todayStart, todayEnd]
                        }
                    }
                });

                if (existingReport) {
                    await existingReport.update({ closingStock: Number(totalStock) });
                } else {
                    await db.stocksReport.create({
                        userId: orgId,
                        openingStock: Number(totalStock)
                    });
                }
            }

            return true;
        } catch (error) {
            console.error('stocksReport error:', error.message);
            return null;
        }
    }


    async operationalMetrics(tokenData, dateString, type) {
        try {
            const date = dateString ? new Date(dateString) : new Date();

            const startOfDay = new Date(date.setHours(0, 0, 0, 0));
            startOfDay.setMinutes(startOfDay.getMinutes() + 330);

            const endOfDay = new Date(date.setHours(23, 59, 59, 999));
            endOfDay.setMinutes(endOfDay.getMinutes() + 330);

            let result = {};

            if (type === 'Sales') {
                const salesData = await salesOpening(tokenData.id, startOfDay, endOfDay);

                // Log sales data to check the response
                console.log('Sales Data:', salesData);

                let duration = null;

                if (
                    salesData?.salesOpening?.confirmationDate &&
                    salesData?.salesClosing?.confirmationDate
                ) {
                    const openingDate = new Date(salesData.salesOpening.confirmationDate);
                    const closingDate = new Date(salesData.salesClosing.confirmationDate);

                    console.log('Opening Date:', openingDate);  // Log the opening date
                    console.log('Closing Date:', closingDate);  // Log the closing date

                    const diffMs = closingDate - openingDate;
                    const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
                    const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

                    duration = `${diffHrs} hr${diffHrs !== 1 ? 's' : ''} ${diffMins} min${diffMins !== 1 ? 's' : ''}`;
                }

                result = {
                    salesOpeningTime: salesData?.salesOpening || null,
                    salesClosingTime: salesData?.salesClosing || null,
                    duration,
                };
            }
            else if (type === 'Purchase') {
                const purchaseData = await purchaseOpening(tokenData.id, startOfDay, endOfDay);

                // Log purchase data to check the response
                console.log('Purchase Data:', purchaseData);

                let duration = null;

                const openingTime = purchaseData?.purchaseOpening?.orderDate;
                const closingTime = purchaseData?.purchaseClosing?.orderDate;

                console.log('Opening Time:', openingTime);  // Log opening time
                console.log('Closing Time:', closingTime);  // Log closing time

                if (openingTime && closingTime) {
                    const openingDate = new Date(openingTime);
                    const closingDate = new Date(closingTime);

                    console.log('Opening Date:', openingDate);  // Log parsed opening date
                    console.log('Closing Date:', closingDate);  // Log parsed closing date

                    const diffMs = closingDate - openingDate;
                    const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
                    const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

                    duration = `${diffHrs} hr${diffHrs !== 1 ? 's' : ''} ${diffMins} min${diffMins !== 1 ? 's' : ''}`;
                }

                result = {
                    purchaseOpeningTime: purchaseData?.purchaseOpening || null,
                    purchaseClosingTime: purchaseData?.purchaseClosing || null,
                    duration,
                };
            }
            else {
                return {
                    status: 400,
                    message: "Invalid type. Please pass 'Sales' or 'Purchase'."
                };
            }

            return {
                status: 200,
                message: `${type} Operational Metrics for today fetched successfully.`,
                data: result
            };
        } catch (error) {
            console.error("❌ Error in operationalMetrics:", error);
            return {
                status: 500,
                message: error.message || "Internal Server Error",
            };
        }
    }

    async stockMetrics(tokenData, dateString, type) {
        try {
            const date = dateString ? new Date(dateString) : new Date();

            const startOfDay = new Date(date.setHours(0, 0, 0, 0));
            startOfDay.setMinutes(startOfDay.getMinutes() + 330);

            const endOfDay = new Date(date.setHours(23, 59, 59, 999));
            endOfDay.setMinutes(endOfDay.getMinutes() + 330);

            // Fetching sales data from stocksReport
            const salesData = await stocksReport(tokenData.id, startOfDay, endOfDay);
            const stockAdded = await StockAdded(tokenData, startOfDay, endOfDay);
            const stockSold = await StockSold(tokenData, startOfDay, endOfDay);

            // Check if salesData and salesData.data are defined
            if (!salesData) {
                throw new Error('Sales data is not available');
            }

            // Returning only openingStock and closingStock
            return {
                status: 200,
                message: 'Stock Metrics for today fetched successfully.',
                data: {
                    openingStock: salesData?.openingStocks,
                    closingStock: salesData?.closingStocks,
                    stockAdded: stockAdded?.data,
                    stockSold: stockSold?.data
                }
            };
        } catch (error) {
            console.error("❌ Error in operationalMetrics:", error.message);
            return {
                status: 500,
                message: error.message || "Internal Server Error",
            };
        }
    }



}

const salesOpening = async (id, startDate, endDate) => {
    try {
        const salesOpening = await db.orders.findOne({
            attributes: [
                'id',
                'invNo',
                [db.sequelize.literal(`confirmationDate + INTERVAL 5 HOUR + INTERVAL 30 MINUTE`), 'confirmationDate']
            ],
            where: {
                orderTo: Number(id), confirmationDate: { [db.Op.not]: null },
                confirmationDate: {
                    [Op.between]: [startDate, endDate]
                }
            },
            order: [['id', 'asc']]
        })
        const salesClosing = await db.orders.findOne({
            attributes: [
                'id',
                'invNo',
                [db.sequelize.literal(`confirmationDate + INTERVAL 5 HOUR + INTERVAL 30 MINUTE`), 'confirmationDate']
            ],
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
            attributes: [
                'id',
                'invNo',
                [db.sequelize.literal(`orderDate + INTERVAL 5 HOUR + INTERVAL 30 MINUTE`), 'orderDate']
            ],
            where: {
                orderFrom: Number(id),
                //  confirmationDate: { [db.Op.not]: null },
                orderDate: {
                    [Op.between]: [startDate, endDate]
                }
            },
            order: [['id', 'asc']]
        })
        const purchaseClosing = await db.orders.findOne({
            attributes: [
                'id',
                'invNo',
                [db.sequelize.literal(`orderDate + INTERVAL 5 HOUR + INTERVAL 30 MINUTE`), 'orderDate']
            ],
            where: {
                orderFrom: Number(id),
                //  confirmationDate: { [db.Op.not]: null },
                orderDate: {
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
                orderStatus: { [db.Op.notIn]: ['Rejected', 'Cancelled'] },
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
                orderStatus: { [db.Op.notIn]: ['Rejected', 'Cancelled'] },
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
const stocksReport = async (id, startDate, endDate) => {
    try {
        const data = await db.stocks.sum('Stock', {
            where: {
                organisationId: Number(id)
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
        return {
            openingStocks: existingReport?.openingStock || 0,
            closingStocks: data || 0
        }
    } catch (error) {
        console.log('stocksReport error:', error.message)
        return null
    }
}
const StockAdded = async (tokenData, startDate, endDate) => {
    try {
        let ownerId = tokenData.id;
        if (tokenData.userType === 'Employee') {
            ownerId = tokenData.data.employeeOf;
        }

        const stockModel = tokenData.userType === 'Manufacturer'
            ? db.manufacturerStocks
            : db.stocks;

        const priceField = tokenData.userType === 'Manufacturer' ? 'PTS' : 'PTR';

        const stockData = await stockModel.findAll({
            where: {
                organisationId: ownerId,
                createdAt: {
                    [Op.between]: [startDate, endDate],
                },
            },
            attributes: ['Stock', priceField],
            raw: true
        });

        let totalStockCount = 0;
        let totalPriceSum = 0;

        for (const item of stockData) {
            const stock = item.Stock || 0;
            const price = item[priceField] || 0;
            totalStockCount += stock;
            totalPriceSum += stock * price;
        }

        return {
            status: 200,
            message: 'Stock Added fetched successfully.',
            data: {
                totalStockCount,
                priceSum: totalPriceSum,
                // priceFieldUsed: priceField
            }
        };

    } catch (error) {
        console.error('❌ Error in StockAdded:', error.message);
        return {
            status: 500,
            message: 'Internal Server Error',
            error: error.message,
        };
    }
}
const StockSold = async (tokenData, startDate, endDate) => {
    try {
        let ownerId = tokenData.id;
        if (tokenData.userType === 'Employee') {
            ownerId = tokenData.data.employeeOf;
        }

        const orderList = await db.orders.findAll({
            where: {
                orderTo: ownerId,
                createdAt: {
                    [Op.between]: [startDate, endDate],
                },
            },
            attributes: ['id'],
            raw: true
        });

        const orderIds = orderList.map(order => order.id);
        if (orderIds.length === 0) {
            return {
                status: 400,
                message: 'No orders found for today.',
                data: {
                    totalStockCount: 0,
                    priceSum: 0
                }
            };
        }

        const orderItems = await db.orderitems.findAll({
            where: {
                orderId: { [Op.in]: orderIds }
            },
            attributes: ['quantity', 'price'],
            raw: true
        });

        let totalStockCount = 0;
        let totalPriceSum = 0;

        for (const item of orderItems) {
            const quantity = item.quantity || 0;
            const price = item.price || 0;

            totalStockCount += quantity;
            totalPriceSum += quantity * price;
        }

        return {
            status: 200,
            message: 'Stock Sold fetched successfully.',
            data: {
                totalStockCount,
                priceSum: totalPriceSum
            }
        };

    } catch (error) {
        console.error('❌ Error in StockSold:', error.message);
        return {
            status: 500,
            message: 'Internal Server Error',
            error: error.message,
        };
    }
}


module.exports = new DoctorsService(db);