const message = require('../helpers/message');
const bcrypt = require('bcrypt');
const db = require('../models/db');
const Users = db.users;
const Retailers = db.retailers;


async function hashPassword(password) {
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    return hashedPassword;
}

class RetailerService {
    constructor(db) {
        this.db = db;
    }

    async createRetailers(data) {
        let transaction;
        try {
            const { userName, password, companyName } = data;
        
            if (!userName || !password || !companyName) {
              return {
                status: message.code400,
                message: "All fields are required",
              }
            }
            transaction = await db.sequelize.transaction();
        
            const hashedPassword = await hashPassword(password);
    
            const user = await Users.create(
                {
                  userName: userName,
                  password: hashedPassword,
                  userType: 'Retailer',
                  status:"Active"
                },
                { transaction }
              );
          
    
            await Retailers.create(
                {
                    retailerId: user.id, // Assuming `id` is the primary key of the `users` table
                    firmName: companyName,
                },
                { transaction }
                );
                 // Commit the transaction
                await transaction.commit();
        
                return {
                    status:message.code200,
                    message:message.message200
                }
        } catch (error) {
            if (transaction) await transaction.rollback();
            console.log('createRetailer error:',error.message)
           return {
                status:message.code500,
                message:message.message500
            }
        }

    }
}

module.exports = new RetailerService(db);
