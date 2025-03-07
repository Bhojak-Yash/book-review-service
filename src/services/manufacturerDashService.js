const message = require('../helpers/message');
const db = require('../models/db');



class manufacturerDashboard {
    constructor(db) {
        this.db = db;
    }

    async countoforders(data) {
        try {
            const {id} = data
            const ordersCount = await db.orders.count({})
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
