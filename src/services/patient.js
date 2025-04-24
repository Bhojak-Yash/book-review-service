const { where } = require('sequelize');
const message = require('../helpers/message');
const db = require('../models/db');
const Op = db.Op


class PatientService {
    constructor(db) {
        this.db = db;
    }

    async createPatient(data,user) {
        try {
            const {mobile,name}= data
            const {id} = user
            if(!mobile || !name){
                return {
                    status:message.code400,
                    message:'Invalid input'
                }
            }
            const check = await db.patients.findOne({
                where:{mobile:Number(mobile),retailerId:Number(id)}
            })
            if(check){
                return {
                    status:message.code400,
                    message:`Patient already register with mobile ${mobile}`
                }
            }
            const insertData ={...data,retailerId:Number(id)}
            const register = await db.patients.create(insertData)
            return {
                status:message.code200,
                message:message.message200,
                apiData:register || null
            }
        } catch (error) {
            console.log('createPatient service error:',error.message)
            return {
                status:message.code500,
                message:error.message
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

}

module.exports = new PatientService(db);
