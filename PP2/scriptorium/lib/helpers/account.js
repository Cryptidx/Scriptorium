import bcrypt from 'bcrypt';

// Hash password function helper
export default async function hashPassword(password, saltRounds) {
    return await bcrypt.hash(password, saltRounds);
  }