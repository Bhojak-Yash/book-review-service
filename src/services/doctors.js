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
                where: { mobile: Number(mobile), retailerId: Number(id) }
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
                where: { mobile: Number(mobile), retailerId: Number(id) }
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
}

module.exports = new DoctorsService(db);
