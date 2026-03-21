// Use mock database for demo (no database required)
// For production, switch to real Prisma client
import { mockDB } from './mockDB.js';

export const prisma = mockDB;

export default prisma;
