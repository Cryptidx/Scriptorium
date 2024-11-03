import bcrypt from 'bcrypt';
import prisma from '../../../lib/prisma'; // Adjust path as necessary
import {isValidPassword, isValidEmail, isValidPhoneNumber} from '../../../lib/validate';    

const saltRounds = process.env.BCRYPT_SALT_ROUNDS;

// Hash password function
async function hashPassword(password) {
  return await bcrypt.hash(password, saltRounds);
}
export default async function handler(req, res) {
    if (req.method !== 'POST') {
      res.setHeader('Allow', ['POST']);
      return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
    }
  
    const { firstName, lastName, password, confirmPassword, email, phoneNumber } = req.body;
    const role = 'user';
  
    if (!firstName || !lastName || !password || !email || !phoneNumber || ! confirmPassword) {
      return res.status(400).json({ error: 'All fields are required.' });
    }

    // Validate email
    if (!isValidEmail(email)) {
      return res.status(400).json({ error: 'Invalid email address.' });
    }
  
    // Validate password strength
    if (!isValidPassword(password)) {
      return res.status(400).json({
        error: 'Password must be at least 8 characters long, include one uppercase letter, one lowercase letter, one number, and one special character.',
      });
    }

    // Validate confirm password
    if(password !== confirmPassword) {
      return res.status(400).json({ error: 'Passwords do not match.' });
    }
  
    // Validate phone number
    if (!isValidPhoneNumber(phoneNumber)) {
      return res.status(400).json({
        error: 'Phone number must contain only numbers and be 10 to 15 digits long.',
      });
    }
  
    try {
      const existingUser = await prisma.user.findUnique({ where: { email } });
      if (existingUser) {
        return res.status(400).json({ error: 'Email already in use.' });
      }
  
      const hashedPassword = await hashPassword(password);
  
      const newUser = await prisma.user.create({
        data: {
          firstName,
          lastName,
          password: hashedPassword,
          email,
          phoneNumber,
          role,
          avatar: 'https://cdn-icons-png.flaticon.com/512/149/149071.png', // place holder, everything must b stored in server 
        },
      });
  
      res.status(201).json({
        user: {
          id: newUser.id,
          firstName: newUser.firstName,
          lastName: newUser.lastName,
          email: newUser.email,
          phoneNumber: newUser.phoneNumber,
          role: newUser.role,
          createdAt: newUser.createdAt,
        },
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'User creation failed.' });
    }
  }