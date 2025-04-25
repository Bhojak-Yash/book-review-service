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
            if (!mobile || !name) {
                return {
                    status: message.code400,
                    message: 'Invalid input'
                }
            }
            const check = await db.patients.findOne({
                where: { mobile: Number(mobile), retailerId: Number(id) }
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
                    [fn('COUNT', col('retailerSalesHeaders.id')), 'orderCount'],
                    [fn('SUM', col('retailerSalesHeaders.totalAmt')), 'totalAmount'],
                ],
                include: [
                    {
                        model: db.retailerSalesHeader,
                        as: 'retailerSalesHeaders',
                        attributes: [],
                        where:{retailerId:Number(id)}
                    },
                ],
                where:whereCondition,
                group: ['patients.id'],
            });
            return {
                status:message.code200,
                message:message.message200,
                currentPage:Page,
                totalPage:Math.ceil(count?.length/Limit),
                totalItems:count.length,
                apiData:patients
            }
        } catch (error) {
            console.log('patients_list service error:', error.message)
            return {
                status: message.code500,
                message: error.message
            }
        }
    }

}

module.exports = new PatientService(db);
