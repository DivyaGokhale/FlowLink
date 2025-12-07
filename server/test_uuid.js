import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';
dotenv.config();

console.log('UUID Test:', uuidv4());
console.log('ENV Test:', process.env.JWT_SECRET ? 'Loaded' : 'Not Loaded');
