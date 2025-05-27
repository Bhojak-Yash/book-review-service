const { where } = require('sequelize');
const message = require('../helpers/message');
const db = require('../models/db');
const Op = db.Op


class PatientService {
    constructor(db) {
        this.db = db;
    }

    async createPatient(data, user) {
        try {
            const { mobile, name } = data
            const { id } = user
            if (!mobile) {
                return {
                    status: message.code400,
                    message: 'Invalid input'
                }
            }
            const check = await db.patients.findOne({
                where: { mobile: Number(mobile), retailerId: Number(id), userStatus: 'Active' }
            })
            if (check) {
                return {
                    status: message.code400,
                    message: `Patient already register with mobile ${mobile}`
                }
            }
            const insertData = { ...data, retailerId: Number(id) }
            const register = await db.patients.create(insertData)
            return {
                status: message.code200,
                message: message.message200,
                apiData: register || null
            }
        } catch (error) {
            console.log('createPatient service error:', error.message)
            return {
                status: message.code500,
                message: error.message
            }
        }
    }

    async checkPatient(data, user) {
        try {
            const { mobile } = data
            const { id } = user
            if (!mobile) {
                return {
                    status: message.code400,
                    message: 'Invalid input'
                }
            }
            console.log(id, mobile)
            const check = await db.patients.findOne({
                where: { mobile: Number(mobile), retailerId: Number(id) }
            })
            if (check) {
                return {
                    status: message.code200,
                    message: `Patient already register with mobile ${mobile}`,
                    apiData: check
                }
            }
            return {
                status: message.code400,
                message: `No patient found with mobile ${mobile}`
            }

        } catch (error) {
            console.log('checkPatient service error:', error.message)
            return {
                status: message.code500,
                message: error.message
            }
        }
    }

    async patients_list(data) {
        try {
            const { id, page, limit, startDate, endDate, search, unpaid } = data
            const Limit = Number(limit) || 10
            const Page = Number(page) || 1
            let skip = 0
            if (Page > 1) {
                skip = (Page - 1) * Limit
            }
            // console.log(data)
            let whereCondition = {};
            if (search) {
                whereCondition = {
                    [Op.or]: [
                        { id: { [Op.like]: `%${search}%` } },
                        { name: { [Op.like]: `%${search}%` } },
                        { mobile: { [Op.like]: `%${search}%` } }
                    ]
                };
            }
            if (unpaid == true || unpaid == 'true') {
                whereCondition.balance = { [Op.gt]: 0 }
            }
            whereCondition.userStatus = 'Active'
            whereCondition.retailerId = Number(id)
            if (startDate && endDate) {
                const startDateParts = data.startDate.split('-');
                const endDateParts = data.endDate.split('-');

                const formattedStartDate = `${startDateParts[2]}-${startDateParts[1]}-${startDateParts[0]} 00:00:00`;
                const formattedEndDate = `${endDateParts[2]}-${endDateParts[1]}-${endDateParts[0]} 23:59:59`;

                whereCondition.createdAt = {
                    [Op.between]: [new Date(formattedStartDate), new Date(formattedEndDate)]
                };
            }

            const { fn, col, literal } = db.Sequelize;

            const { count, rows: patients } = await db.patients.findAndCountAll({
                attributes: [
                    'id',
                    'name',
                    'createdAt',
                    'mobile',
                    'discount',
                    'userStatus',
                    // [fn('COUNT', col('retailerSalesHeaders.id')), 'orderCount'],
                    // [fn('SUM', col('retailerSalesHeaders.totalAmt')), 'totalAmount'],
                ],
                include: [
                    {
                        model: db.retailerSalesHeader,
                        as: 'retailerSalesHeaders',
                        attributes: ['id', 'totalAmt'],
                        where: { retailerId: Number(id) },
                        required: false
                    },
                ],
                order: [["id", "desc"]],
                where: whereCondition,
                group: ['patients.id'],
                offset: skip,
                limit: Limit,
            });

            const returnData = patients?.map((patients) => {
                return {
                    "id": patients?.id || null,
                    "name": patients?.name || "",
                    "createdAt": patients?.createdAt || null,
                    "mobile": patients?.mobile || null,
                    "discount": patients?.discount || null,
                    "userStatus": patients?.userStatus || 0,
                    "orderCount": patients?.retailerSalesHeaders?.length || 0,
                    "totalAmount": patients?.retailerSalesHeaders?.reduce((total, item) => {
                        return total + (item.totalAmt || 0);
                    }, 0),
                    // "retailerSalesHeaders": [
                    //     {
                    //         "id": 29,
                    //         "totalAmt": 1500
                    //     }
                    // ]
                }
            })
            return {
                status: message.code200,
                message: message.message200,
                currentPage: Page,
                totalPage: Math.ceil(count?.length / Limit),
                totalItems: count.length,
                apiData: returnData,
                
            }
        } catch (error) {
            console.log('patients_list service error:', error.message)
            return {
                status: message.code500,
                message: error.message
            }
        }
    }

    async patient_orders(data) {
        try {
            const { id, patientId, startDate, endDate, page, limit } = data
            if (!patientId) {
                return {
                    status: message.code400,
                    message: 'Input invalid'
                }
            }
            const Limit = Number(limit) || 10
            const Page = Number(page) || 1
            let skip = 0
            if (Page > 1) {
                skip = (Page - 1) * Limit
            }
            // console.log(data)
            let whereCondition = { retailerId: Number(id), patientId: Number(patientId) };
            // if (search) {
            //     whereCondition = {
            //         [Op.or]: [
            //             { id: { [Op.like]: `%${search}%` } },
            //             { name: { [Op.like]: `%${search}%` } },
            //             { mobile: { [Op.like]: `%${search}%` } }
            //         ]
            //     };
            // }

            if (startDate && endDate) {
                const startDateParts = data.startDate.split('-');
                const endDateParts = data.endDate.split('-');

                const formattedStartDate = `${startDateParts[2]}-${startDateParts[1]}-${startDateParts[0]} 00:00:00`;
                const formattedEndDate = `${endDateParts[2]}-${endDateParts[1]}-${endDateParts[0]} 23:59:59`;

                whereCondition.createdAt = {
                    [Op.between]: [new Date(formattedStartDate), new Date(formattedEndDate)]
                };
            }

            const patientDetails = await db.patients.findOne({
                where: { id: Number(patientId), retailerId: Number(id) },
                // don’t set `attributes: [...]` explicitly, so Sequelize SELECTs all columns
                attributes: {
                    include: [
                        [
                            // subquery to sum balances for this patient
                            db.sequelize.literal(`(
                        SELECT COALESCE(SUM(balance), 0)
                        FROM retailer_sales_header
                        WHERE retailer_sales_header.patientId = ${Number(patientId)}
                      )`),
                            'totalBalance'
                        ]
                    ]
                }
            });


            const { count, rows: orders } = await db.retailerSalesHeader.findAndCountAll({
                attributes: ['id', 'patientId', 'doctorId', 'totalAmt', 'balance', 'date', 'paymentMode'],
                include: [
                    {
                        model: db.patients,
                        as: 'patient',
                        attributes: ['id', 'discount'],
                        where: { id: Number(patientId) }
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
                    "paymentMode": item?.paymentMode,
                    "balance": item?.balance || 0,
                    "status": item?.balance > 0 ? 'Unpaid' : 'Paid',
                    "paymentStatus": item?.balance > 0 ? `${item?.balance} Due` : 'Paid',
                    "discount": item?.patient?.discount
                }
            })

            return {
                status: message.code200,
                message: message.message200,
                currentPage: Page,
                totalPage: Math.ceil(count / Limit),
                totalItems: count,
                orders: result || {},
                patientDetails
            }
        } catch (error) {
            console.log('patient_orders service error:', error.message)
            return {
                status: message.code500,
                message: error.message
            }
        }
    }

    async patient_delete(data) {
        try {
            const { id, patientId } = data
            if (!patientId) {
                return {
                    status: message.code400,
                    message: 'Patient id is required'
                }
            }

            await db.patients.update({ userStatus: 'Inactive' }, {
                where: {
                    id: Number(patientId),
                    retailerId: Number(id)
                }
            })

            return {
                status: message.code200,
                message: message.message200
            }
        } catch (error) {
            console.log('patient_delete service error:', error.message)
            return {
                status: message.code500,
                message: error.message
            }
        }
    }
    async patient_update(data, userData) {
        try {
            const Data = data.data
            console.log(data, userData)
            const aa = await db.patients.update(Data, { where: { id: Number(data?.patientId) } })
            console.log(aa)
            return {
                status: message.code200,
                message: 'Patient updated successfully'
            }
        } catch (error) {
            console.log('patient_update service error:', error.message)
            return {
                status: message.code500,
                message: error.message
            }
        }
    }

}

module.exports = new PatientService(db);
