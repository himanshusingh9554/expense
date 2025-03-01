import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

const host = process.env.DB_HOST || "localhost";
const user = process.env.DB_USER || "root";
const pass = process.env.DB_PASS || "rootnode";
const dbName = process.env.DB_NAME || "expense";

const sequelize = new Sequelize(dbName, user, pass, {
  host: host,
  dialect: process.env.DB_DIALECT || "mysql",
  port: 3306, 
});
(async () => {
    try {
        await sequelize.authenticate();
        console.log('✅ Database connected successfully');
    } catch (error) {
        console.error('❌ Unable to connect to the database:', error);
    }
})();


export default sequelize;
