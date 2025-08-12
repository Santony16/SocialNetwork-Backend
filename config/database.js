const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize({
  database: process.env.DB_NAME,
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  host: "ANTHONY",
  dialect: 'mssql',
  dialectOptions: {
    options: {
      encrypt: false,
      trustServerCertificate: true,
      useUTC: false,
      dateFirst: 1
    }
  },
  timezone: 'local',
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  },
  logging: console.log 
});

async function testConnection() {
  try {
    await sequelize.authenticate();
    console.log('Connection to SQL Server has been established successfully.');
  } catch (error) {
    console.error('Unable to connect to the database:', error);
  }
}

module.exports = { sequelize, testConnection };
