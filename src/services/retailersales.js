const message = require('../helpers/message');
const db = require('../models/db');
const Op = db.Op


class RetailerSalesService {
    constructor(db) {
        this.db = db;
    }

    async searchMedicine(data) {
        try {
            const { search, id, limit, page } = data
            // console.log(data)
            if (!search || search.length < 3) {
                return {
                    status: message.code400,
                    message: 'Invalid input'
                }
            }
            const Limit = Number(limit) || 10
            const Page = Number(page) || 1
            let skip = 0
            if (Page > 1) {
                skip = (Page - 1) * Limit
            }
            const halfLength = Math.floor(search?.length / 2);
            const firstHalf = search?.substring(0, halfLength);
            const firstThree = search?.substring(0, 3);

            const likeConditions = {
                [Op.or]: [
                    { [Op.eq]: search },
                    { [Op.like]: `%${search}%` },
                    { [Op.like]: `%${firstHalf}%` },
                    { [Op.like]: `${firstThree}%` }
                ]
            }
            const { count, rows: Data } = await db.stocks.findAndCountAll({
                attributes: ['SId', 'PId', 'BatchNo', 'MRP', 'PTR', 'ExpDate', 'Stock'],
                include: [
                    {
                        model: db.products,
                        as: "product",
                        attributes: ['PId', 'PName', 'SaltComposition', 'manufacturerId', 'Package', 'HSN'],
                        where: {
                            PName: likeConditions
                        },
                        required: true,
                        include: [
                            {
                                model: db.manufacturers,
                                as: "manufacturer",
                                attributes: ['manufacturerId', 'companyName'],
                            }
                        ]
                    }
                ],
                where: { organisationId: Number(id) },
                limit: Limit,
                offset: skip
            })
            // const formatData = {
            //     "SId": 93,
            //     "PId": 211,
            //     "BatchNo": "123",
            //     "MRP": 123,
            //     "PTR": 1123,
            //     "ExpDate": "2025-04-30T18:30:00.000Z",
            //     "Stock": 6,
            //     "product": {
            //         "PId": 211,
            //         "PName": "Apple",
            //         "SaltComposition": "Cyanide",
            //         "manufacturerId": 10,
            //         "Package": "",
            //         "HSN": 123123,
            //         "manufacturer": {
            //             "manufacturerId": 10,
            //             "companyName": "kushal"
            //         }
            //     }
            // }
            return {
                status: message.code200,
                message: message.message200,
                currentPage: Page,
                totalItem: count,
                totalPage: Math.ceil(count / Limit),
                apiData: Data
            }
        } catch (error) {
            console.log('searchMedicine service error:', error.message)
            return {
                status: message.code500,
                message: error.message
            }
        }
    }

    async create_sales_order(data, user) {
        let transaction;
        try {
            // console.log(user, ';;;;;;;;')
            transaction = await db.sequelize.transaction();
            const doctor = await db.doctors.findOne({ where: { id: Number(data?.order?.doctorId) } })
            const orderDetails = {
                "date": data?.order?.date,
                "patientId": data?.order?.patientId,
                "doctorId": data?.order?.doctorId,
                "address": data?.order?.address,
                "regNo": data?.order?.regNo,
                "subTotal": data?.order?.subTotal,
                "discount": data?.order?.discount,
                "totalAmt": data?.order?.totalAmt,
                "SGST": data?.order?.SGST,
                "CGST": data?.order?.CGST,
                "balance": data?.order?.balance,
                "retailerId": Number(user.id),
                "paymentMode": data?.order?.paymentMode || "Cash",
                "orderStatus": "Created",
                "inv_url": data?.order?.inv_url
            }
            const order = await db.retailerSalesHeader.create(orderDetails, { transaction })
            const orderItmes = data?.items?.map((item) => {
                return {
                    "headerId": order?.id,
                    "PId": item?.PId,
                    "SId": item?.SId,
                    "qty": item?.qty,
                    "MRP": item?.MRP,
                    "rate": item?.rate,
                    "SGST": item?.SGST,
                    "CGST": item?.CGST,
                    "amount": item?.amount
                }
            })
            // console.log(orderItmes,order.items)
            const orderItem = await db.retailerSalesDetails.bulkCreate(orderItmes, { transaction })
            const doctorCommission = Number((Number(data?.order?.totalAmt) * Number(doctor?.commission) / 100).toFixed(2))
            const updateBalane = await db.doctors.update({ balance: db.sequelize.literal(`COALESCE(balance, 0) + ${doctorCommission}`) }, { where: { id: Number(data?.order?.doctorId) }, transaction })
            function generateBillNumber(firmName, id) {
                const firstLetter = firmName.trim().charAt(0).toUpperCase();
                const date = new Date().toISOString().slice(0, 10).replace(/-/g, ''); // YYYYMMDD
                return `${firstLetter}/${date}/${id}`;
            }
            const billNumber = generateBillNumber(user?.data?.firmName, order?.id);
            // console.log(billNumber)
            await db.retailerSalesHeader.update({billNumber:billNumber,invNo:`INV/${order?.id}`},{where:{id:Number(order?.id)},transaction})
            await db.doctors.update({name:data?.order?.doctorName,RGNo:data?.order?.doctorRGNo},{where:{id:Number(data?.order?.doctorId)},transaction})
            await db.patients.update({name:data?.order?.patientName,address:data?.order?.patientAddress},{where:{id:Number(data?.order?.patientId)},transaction})
            await transaction.commit();
            return {
                status: message.code200,
                message: message.message200,
                billNumber:billNumber,invNo:`INV/${order?.id}`,
                orderId:order?.id,
                data:user.data
            }
        } catch (error) {
            if (transaction) await transaction.rollback();
            console.log('create_sales_order service error:', error.message)
            return {
                status: message.code500,
                message: error.message
            }
        }
    }

    async retailer_sales_orders(data) {
        try {
            const { id, page, limit, search, unpaid, startDate, endDate } = data
            const Limit = Number(limit) || 10
            const Page = Number(page) || 1
            let skip = 0
            if (Page > 1) {
                skip = (Page - 1) * Limit
            }
            // console.log(data)
            let whereCondition = { retailerId: Number(id) };
            if (search) {
                whereCondition = {
                    retailerId: Number(id),
                    [Op.or]: [
                        { id: { [Op.like]: `%${search}%` } },
                        { '$patient.name$': { [Op.like]: `%${search}%` } },
                        { '$doctor.name$': { [Op.like]: `%${search}%` } }
                    ]
                };
            }
            if (unpaid == true || unpaid == 'true') {
                whereCondition.balance = { [Op.gt]: 0 }
            }
            whereCondition.orderStatus = { [Op.not]: "Deleted" }
            if (startDate && endDate) {
                const startDateParts = data.startDate.split('-');
                const endDateParts = data.endDate.split('-');

                const formattedStartDate = `${startDateParts[2]}-${startDateParts[1]}-${startDateParts[0]} 00:00:00`;
                const formattedEndDate = `${endDateParts[2]}-${endDateParts[1]}-${endDateParts[0]} 23:59:59`;

                whereCondition.date = {
                    [Op.between]: [new Date(formattedStartDate), new Date(formattedEndDate)]
                };
            }
            console.log(whereCondition)
            const { count, rows: orders } = await db.retailerSalesHeader.findAndCountAll({
                attributes: ['id', 'patientId', 'doctorId', 'totalAmt', 'balance', 'date', 'paymentMode', 'orderStatus', 'inv_url'],
                include: [
                    {
                        model: db.patients,
                        as: 'patient',
                        attributes: ['id', 'name', 'mobile']
                    },
                    {
                        model: db.doctors,
                        as: "doctor",
                        attributes: ['id', 'name', 'mobile', 'commission']
                    }
                ],
                where: whereCondition,
                order: [['id', 'desc']],
                limit: Limit,
                offset: skip
            })
            const result = await orders?.map((item) => {
                return {
                    "id": item?.id,
                    "orderDate": item?.date,
                    "patientId": item?.patientId,
                    "doctorId": item?.doctorId,
                    "totalAmt": item?.totalAmt,
                    "patientName": item?.patient?.name,
                    "doctorName": item?.doctor?.name,
                    "commission": Math.round(Number(item?.totalAmt) * Number(item?.doctor?.commission) / 100),
                    "balance": item?.balance || 0,
                    "status": item?.balance > 0 ? 'Unpaid' : 'Paid',
                    "paymentMode": item?.paymentMode,
                    "orderStatus": 'Completed',
                    "invUrl": item?.inv_url
                }
            })
            return {
                status: message.code200,
                message: message.message200,
                currentPage: Page,
                totalPage: Math.ceil(count / Limit),
                totalItem: count,
                apiData: result
            }
        } catch (error) {
            console.log('retailer_sales_orders service error:', error.message)
            return {
                status: message.code500,
                message: error.message
            }
        }
    }

    async make_doctors_payment(data) {
        let transaction;
        try {
            transaction = await db.sequelize.transaction();
            const { id, doctorId, amount, mode, imageURL } = data
            const payment = await db.doctorPayments.create({
                doctorId: Number(doctorId),
                retailerId: Number(id),
                amount: Number(amount),
                mode: mode,
                imageURL: imageURL,
                status: "Pending"
            }, transaction)
            const updateBalane = await db.doctors.update({ balance: db.sequelize.literal(`COALESCE(balance, 0) - ${amount}`) }, { where: { id: Number(doctorId) }, transaction })
            await transaction.commit();
            return {
                status: message.code200,
                message: message.message200,
                apiData: payment
            }
        } catch (error) {
            console.log('make_doctors_payment service error:', error.message)
            if (transaction) await transaction.rollback();
            return {
                status: message.code200,
                message: error.message
            }
        }
    }

    async delete_order(data) {
        try {
            const { id, orderId } = data
            if (!orderId) {
                return {
                    status: message.code400,
                    message: 'order id is required'
                }
            }

            await db.retailerSalesHeader.update({ orderStatus: "Deleted" }, {
                where: {
                    id: Number(orderId),
                    retailerId: Number(id)
                }
            })
            return {
                status: message.code200,
                message: message.message200
            }
        } catch (error) {
            console.log('delete_order service error:', error.message)
            return {
                status: message.code500,
                message: error.message
            }
        }
    }
    async update_sales_order(data) {
        try {
            const { id, orderId, invUrl } = data
            if (!orderId || !invUrl) {
                return {
                    status: message.code400,
                    message: 'Invalid Input'
                }
            }
            await db.retailerSalesHeader.update({ inv_url: invUrl }, { where: { id: Number(orderId), retailerId: Number(id) } })
            return {
                status: message.code200,
                message: message.message200
            }
        } catch (error) {
            console.log('update_sales_order service error:', error.message)
            return {
                status: message.code500, message: error.message
            }
        }
    }
}

module.exports = new RetailerSalesService(db);
