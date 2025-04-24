const message = require('../helpers/message');
const db = require('../models/db');
const Op = db.Op


class DoctorsService {
    constructor(db) {
        this.db = db;
    }

    async createDoctor(data) {
        
    }
}

module.exports = new DoctorsService(db);
