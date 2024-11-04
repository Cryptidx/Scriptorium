import bcrypt from 'bcrypt';

const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS, 10);

// Hash password function helper
export default async function hashPassword(password) {
    return await bcrypt.hash(password, saltRounds);
  }