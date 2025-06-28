require('dotenv').config();

module.exports = {
  HOST: process.env.MYSQL_HOST,
  USER: process.env.MYSQL_USER,
  PASSWORD: process.env.MYSQL_PASSWORD,
  DB: process.env.MYSQL_DB,
  PORT: process.env.MYSQL_PORT || 3306,
  dialect: 'mysql',
  logging: false, // ✅ Disables SQL query logs
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  }
};
