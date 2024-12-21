const dotenv =require('dotenv')

dotenv.config();

const dbConfig = {
  HOST: process.env.MYSQL_HOST,
  USER: process.env.MYSQL_USER,
  PASSWORD: process.env.MYSQL_PASSWORD,
  DB: process.env.MYSQL_DB,
  PORT: process.env.MYSQL_PORT,
  pool: {
    max: 100,
    min: 0,
    acquire: 60000,
    idle: 10000,
  },
};



module.exports= dbConfig;
