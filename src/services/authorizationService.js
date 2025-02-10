const db = require('../models/db');
const message = require('../helpers/message')

class AuthService {
    constructor(db) {
        this.db = db;
    }

    async distributer_auth_request(data) {
        try {
            const { authorizedBy, authorizedId } = data
            const check = await db.authorizations.findOne({
                where: {
                    authorizedBy: Number(authorizedBy),
                    authorizedId: Number(authorizedId),
                    // status: 'Pending'
                }
            })
            if(check.status==='Pending'){
                return {
                    status:message.code400,
                    message:'Your authorization request is already pending. Please wait for approval before submitting a new request'
                }
            }else if(check.status==='Not Send'){
              const Data =   await db.authorizations.update(
                    { status: 'Pending' }, // Update fields
                    { where: { id: Number(check.id) } } // Condition
                );
                return {
                    status: message.code200,
                    message: 'Authorization request sent',
                    // apiData: Data
                }
            }

            const Data = await db.authorizations.create({
                authorizedBy: Number(authorizedBy),
                authorizedId: Number(authorizedId),
                status: 'Pending'
            })
            return {
                status: message.code200,
                message: 'Authorization request sent',
                apiData: Data
            }
        } catch (error) {
            console.log('distributer_auth_request error:', error.message)
            return {
                status: message.code500,
                message: error.message,
                apiData: null
            }
        }
    }

}

module.exports = new AuthService(db);
