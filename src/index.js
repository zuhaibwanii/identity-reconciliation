// require('dotenv').config({path: './env'})
import dotenv from "dotenv"
import dbClient from "./db/index.js";
import { app } from './app.js'
dotenv.config({
    path: './.env'
})
let PORT = process.env.PORT || 4000;


(async () => {
    const db = dbClient;
    try {
        console.log('🤞 Trying to connect MYSQL');
        await db.$connect();
        console.info('✅ Connection has been established with MYSQL.');
    } catch (error) {
        console.error('💥 Error while connecting MYSQL', error);
        process.exit(1)
    }

    app.listen(PORT, () => {
        console.log(`⚙️  Server is running at PORT : ${PORT}`);
    })
})();
