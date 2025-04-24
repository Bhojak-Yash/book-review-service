const message = require('../helpers/message');
const db = require('../models/db');
const Op = db.Op


class PatientService {
    constructor(db) {
        this.db = db;
    }

    async createPatient(data) {
        try {
            // const {}
        } catch (error) {
            console.log('createPatient service error:',error.message)
            return {
                status:message.code500,
                message:error.message
            }
        }
    }
}

module.exports = new PatientService(db);
