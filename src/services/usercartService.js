const message = require('../helpers/message');
const bcrypt = require('bcrypt');
const db = require('../models/db');

class UsersCartService {
    constructor(db) {
        this.db = db;
    }

    async addToCart(data) {

    }
}

module.exports = new UsersCartService(db);
