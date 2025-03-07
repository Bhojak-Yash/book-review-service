const message = require('../helpers/message');
const db = require('../models/db');
// const { subDays } = require('date-fns'); // Helps with date calculations





class manufacturerDashboard {
    constructor(db) {
        this.db = db;
    }

    async countoforders(data) {
        try {
            const {id} = data
            console.log(data)
            // const last30Days = subDays(new Date(), 30);
            const [ordersCount] = await db.sequelize.query(`
            SELECT COUNT(*) FROM orders 
            WHERE orderTo = ${Number(id)} 
            AND createdAt >= NOW() - INTERVAL 30 DAY
        `);
            const productCount = await db.products.count({where:{manufacturerId:Number(id)}})
            const authorizedUser = await db.authorizations.count({where:{authorizedBy:Number(id),status:'Approved'}})

            return {
                staus:message.code200,
                message:message.message200,
                apiData:{ordersCount,productCount,authorizedUser}
            }
        } catch (error) {
            console.log('countoforders service error:', error.message)
            return {
                status: message.code500,
                message: message.message500
            }
        }
    }

}

module.exports = new manufacturerDashboard(db);
