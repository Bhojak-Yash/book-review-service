const db = require('../models/db')
const sequelize = db.sequelize
const message = require('../helpers/message')


exports.inquiry = async (req, res) => {
    try {
        const { mobile } = req.body
        const FullIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
        const ip = FullIp.includes('::ffff:') ? FullIp.split('::ffff:')[1] : FullIp;
        console.log(ip,FullIp)
        const data = await sequelize.query(`
            INSERT INTO inquiries (mobile, ip, isDeleted,createdAt,updatedAt)
            VALUES (:mobile, :ip, :isDeleted,:createdAt,:updatedAt)
        `, {
            replacements: {
                mobile: mobile,
                ip: ip,
                isDeleted: false,
                createdAt:new Date(),
                updatedAt:new Date()
            },
            type: sequelize.QueryTypes.INSERT
        });
        res.json({
            status:message.code200,
            message:message.message200,
            // apiData:data
        })
    } catch (error) {
        console.log("inquiry error:", error.message)
        res.json({
            status: message.code500,
            message: message.message500,
            apiData: null
        })
    }
}