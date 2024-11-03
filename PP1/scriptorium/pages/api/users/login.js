import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import prisma from '../../../lib/prisma'; // Adjust path as necessary

const ACCESS_TOKEN_SECRET = process.env.JWT_SECRET_ACCESS; 
const REFRESH_TOKEN_SECRET = process.env.JWT_SECRET_REFRESH; 
const EXPIRE_ACCESS = process.env.JWT_EXPIRES_IN_ACCESS;
const EXPIRE_REFRESH = process.env.JWT_EXPIRES_IN_REFRESH;

function generateTokens(user) {
  const accessToken = jwt.sign(
    { userId: user.id, role: user.role },
    ACCESS_TOKEN_SECRET,
    { expiresIn: EXPIRE_ACCESS }
  );
  const refreshToken = jwt.sign(
    { userId: user.id },
    REFRESH_TOKEN_SECRET,
    { expiresIn: EXPIRE_REFRESH }
  );
  return { accessToken, refreshToken };
}

/**
 * @api {post} /api/users/login Login a user
 * @apiName LoginUser
 * @apiGroup User
 * @apiVersion 1.0.0
 *
 * @apiBody {String} email User's email address.
 * @apiBody {String} password User's password.
 *
 * @apiSuccess {String} message Success message.
 * @apiSuccess {String} accessToken Access token for authenticated requests.
 * @apiSuccess {String} refreshToken Refresh token for generating new access tokens.
 * @apiSuccess {Object} user Logged-in user data.
 * @apiSuccess {Number} user.id User ID.
 * @apiSuccess {String} user.firstName First name.
 * @apiSuccess {String} user.lastName Last name.
 * @apiSuccess {String} user.email Email.
 * @apiSuccess {String} user.role Role of the user.
 *
 * @apiError (400) All fields are required.
 * @apiError (404) UserNotFound User with the specified email was not found.
 * @apiError (405) MethodNotAllowed Only POST requests are allowed.
 * @apiError (422) LoginFailed unexpected issues during login.
 */

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  const { email, password } = req.body;

  // Validate input fields
  if (!email || !password) {
    return res.status(404).json({ error: 'Email and password are required.' });
  }

  try {
    // Find the user by email
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(404).json({ error: 'Invalid email or password.' });
    }

    // Compare the provided password with the stored hashed password
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(404).json({ error: 'Invalid email or password.' });
    }

    // Generate a JWT tokens
    const { accessToken, refreshToken } = generateTokens(user);

    // Return both tokens in the response
    res.status(200).json({
        message: 'Login successful',
        accessToken,
        refreshToken,
        user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        },
    });
    } catch (error) {
        console.error('Login error:', error);
      
        if (error.message.includes('validation') || error.code === 'P2002') {
          // Use 400 for validation issues if applicable
          res.status(400).json({ error: 'Bad Request: Data validation failed.' });
        } else {
          // Use 422 Unprocessable Entity for unexpected login issues
          res.status(422).json({ error: 'Unprocessable Entity: Unable to complete login.' });
        }
      }
}