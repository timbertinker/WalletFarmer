import dotenv from 'dotenv';
dotenv.config({ path: './.env' }); 
import mongoose from 'mongoose';
import { createTgBot } from './tgBot/index.js';

(async () => {
    createTgBot();
    mongoose.connect(process.env.MONGO_URL).then(() => console.log("Database connected!"));
})();