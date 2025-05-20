const message = require('../helpers/message');
const db = require('../models/db');
const Op = db.Op


class DoctorsService {
    constructor(db) {
        this.db = db;
    }

    async createDoctor(data, user) {
        try {
            const { mobile, name } = data
            const { id } = user
            if (!mobile || !name) {
                return {
                    status: message.code400,
                    message: 'Invalid input'
                }
            }
            const check = await db.doctors.findOne({
                where: { mobile: Number(mobile), retailerId: Number(id), userStatus: 'Active' }
            })
            if (check) {
                return {
                    status: message.code400,
                    message: `Doctor already register with mobile ${mobile}`
                }
            }
            const insertData = { ...data, retailerId: Number(id) }
            const register = await db.doctors.create(insertData)
            return {
                status: message.code200,
                message: message.message200,
                apiData: register || null
            }
        } catch (error) {
            console.log('createDoctor service error:', error.message)
            return {
                status: message.code500,
                message: error.message
            }
        }
    }

    async checkdoctor(data, user) {
        try {
            const { mobile } = data
            const { id } = user
            if (!mobile) {
                return {
                    status: message.code400,
                    message: 'Invalid input'
                }
            }
            const check = await db.doctors.findOne({
                where: { mobile: Number(mobile), retailerId: Number(id), userStatus: 'Active' }
            })
            if (check) {
                return {
                    status: message.code200,
                    message: `Doctor already register with mobile ${mobile}`,
                    apiData: check
                }
            }
            return {
                status: message.code400,
                message: `No doctor found with mobile ${mobile}`
            }

        } catch (error) {
            console.log('checkdoctor service error:', error.message)
            return {
                status: message.code500,
                message: error.message
            }
        }
    }

    async doctors_list(data) {
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
            whereCondition.userStatus = 'Active'
            const { fn, col, literal } = db.Sequelize;

            const { count, rows: doctors } = await db.doctors.findAndCountAll({
                attributes: [
                    'id',
                    'name',
                    'createdAt',
                    'mobile',
                    'commission',
                    'RGNo',
                    "userStatus",
                    [fn('COUNT', col('retailerSalesHeaders.id')), 'orderCount'],
                    [fn('SUM', col('retailerSalesHeaders.totalAmt')), 'totalAmount'],
                ],
                include: [
                    {
                        model: db.retailerSalesHeader,
                        as: 'retailerSalesHeaders',
                        attributes: [],
                        where: { retailerId: Number(id) },
                        required: false
                    },
                ],
                where: whereCondition,
                group: ['doctors.id'],
            });
            const finalResult = await doctors?.map((item) => {
                return {
                    "id": item?.id,
                    "name": item?.name,
                    "createdAt": item?.createdAt,
                    "mobile": item?.mobile,
                    "RGNo": item?.RGNo || null,
                    "commission": item?.commission,
                    "orderCount": item?.dataValues?.orderCount,
                    "totalAmount": item?.dataValues?.totalAmount,
                    "userStatus": item?.dataValues?.userStatus,
                    "totalCommission": (Number(item?.dataValues?.totalAmount) * Number(item?.commission) / 100)
                }
            })
            return {
                status: message.code200,
                message: message.message200,
                currentPage: Page,
                totalPage: Math.ceil(count?.length / Limit),
                totalItems: count.length,
                apiData: finalResult
            }
        } catch (error) {
            console.log('doctors_list service error:', error.message)
            return {
                status: message.code500,
                message: error.message
            }
        }
    }

    async doctor_details(data) {
        try {
            const { id, doctorId } = data
            if (!doctorId) {
                return {
                    status: message.code400,
                    message: 'Input invalid'
                }
            }
            // console.log(doctorId,id)
            const doctorDetails = await db.doctors.findOne({
                where: { id: Number(doctorId), retailerId: Number(id) },
                include: [
                    {
                        model: db.doctorPayments,
                        as: "doctorPayments"
                    }
                ]
            })

            return {
                status: message.code200,
                message: message.message200,
                apiData: doctorDetails
            }
        } catch (error) {
            console.log('doctor_details service error:', error.message)
            return {
                status: message.code500,
                message: error.message
            }
        }
    }
    async doctor_delete(data) {
        try {
            const { id, doctorId } = data
            if (!doctorId) {
                return {
                    status: message.code400,
                    message: 'doctor id is required'
                }
            }
            const updateDoctor = await db.doctors.update({ userStatus: "Inactive" }, {
                where: {
                    id: Number(doctorId),
                    retailerId: Number(id)
                }
            })
            return {
                status: message.code200,
                message: 'Doctor deleted successfully.'
            }
        } catch (error) {
            console.log('doctor_delete service error:', error.message)
            return {
                status: message.code500,
                message: error.message
            }
        }
    }
    async doctor_update(data,userData) {
        try {
            const Data = data.data
            // console.log(data, userData)
            const aa = await db.doctors.update(Data, { where: { id: Number(data?.doctorId) } })
            // console.log(aa)
            return {
                status: message.code200,
                message: 'Doctor updated successfully'
            }
        } catch (error) {
            console.log('doctor_update service error:', error.message)
            return {
                status: message.code500,
                message: error.message
            }
        }
    }
}

module.exports = new DoctorsService(db);
