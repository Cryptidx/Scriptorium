import bcrypt from 'bcrypt';
import prisma from '../../../lib/prisma'; // Database client
import { isValidPassword, isValidEmail, isValidPhoneNumber } from '../../../lib/validate';
import { authMiddleware } from '../../../lib/auth'; // Use authMiddleware for authentication check

const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS, 10);

const allowedAvatars = [
    '/avatar_images/pfp1.png',
    '/avatar_images/pfp2.png',
    '/avatar_images/pfp3.png',
    '/avatar_images/pfp4.png',
    '/avatar_images/pfp5.png',
];

// Hash password function
async function hashPassword(password) {
  return await bcrypt.hash(password, saltRounds);
}

/**
 * @api {put} /api/users/update Update user information
 * @apiName UpdateUser
 * @apiGroup User
 * @apiVersion 1.0.0
 *
 * @apiHeader {String} Authorization User's access token.
 *
 * @apiBody {String} [firstName] New first name.
 * @apiBody {String} [lastName] New last name.
 * @apiBody {String} [email] New email address.
 * @apiBody {String} [phoneNumber] New phone number.
 * @apiBody {String} [password] New password.
 * @apiBody {String} [confirmPassword] Confirmation for the new password.
 * @apiBody {String} [avatar] Avatar image path (selected from predefined list).
 *
 * @apiSuccess {String} message Success message.
 * @apiSuccess {Object} user Updated user data.
 * @apiSuccess {Number} user.id User ID.
 * @apiSuccess {String} user.firstName First name.
 * @apiSuccess {String} user.lastName Last name.
 * @apiSuccess {String} user.email Email.
 * @apiSuccess {String} user.phoneNumber Phone number.
 * @apiSuccess {String} user.avatar Updated avatar URL.
 *
 * @apiError (400) ValidationError Validation errors if fields are invalid.
 * @apiError (401) Unauthorized Invalid access token.
 * @apiError (405) MethodNotAllowed Only PUT requests are allowed.
 * @apiError (422) UpdateFailed unable to update user.
 */

// Main handler logic for updating user details
async function updateHandler(req, res) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  // Run authMiddleware and get userId from the requestif (!getFullUser) {
  const authRes = await authMiddleware(req, res);
  if (!authRes) return; // Exit if unauthorized

  const { userId } = authRes;

  const { firstName, lastName, password, confirmPassword, email, phoneNumber, avatar } = req.body;
  let updates = {};

  // Check if at least one field is provided
  const hasUpdateField = [
    firstName, 
    lastName, 
    password, 
    email, 
    phoneNumber, 
    avatar, // Check if an avatar is provided
  ].some(field => field !== undefined && field !== null && field !== '');

  if (!hasUpdateField) {
    return res.status(400).json({ error: 'At least one field must be provided for update.' });
  }

  // Conditionally update fields if provided in request body
  if (firstName) updates.firstName = firstName;
  if (lastName) updates.lastName = lastName;
  if (email) {
    if (!isValidEmail(email)) {
      return res.status(400).json({ error: 'Invalid email address.' });
    }
  
    // Check if the email is already used by another user
    const existingUser = await prisma.user.findFirst({
      where: {
        email: email,
        NOT: { id: userId }, // Exclude the current user by their ID
      },
    });
  
    if (existingUser) {
      return res.status(400).json({ error: 'Email is already in use by another account.' });
    }
  
    updates.email = email; // Set the email for updating if it passes validation
  }
  if (phoneNumber) {
    if (!isValidPhoneNumber(phoneNumber)) {
      return res.status(400).json({
        error: 'Phone number must contain only numbers and be 10 to 15 digits long.',
      });
    }
    updates.phoneNumber = phoneNumber;
  }

  // Validate and hash password if provided
  if (password) {
    if (!isValidPassword(password)) {
      return res.status(400).json({
        error: 'Password must be at least 8 characters long, include one uppercase letter, one lowercase letter, one number, and one special character.',
      });
    }
    if (password !== confirmPassword) {
      return res.status(400).json({ error: 'Passwords do not match.' });
    }
    updates.password = await hashPassword(password);
  }

  // Handle avatar if provided
  if (avatar) {
    if (!allowedAvatars.includes(avatar)) {
      return res.status(400).json({ error: 'Invalid avatar selection. Please choose a predefined avatar.' });
    }
    updates.avatar = avatar;
  }

  try {
    // Update user in the database
    const updatedUser = await prisma.user.update({
        where: { id: userId }, // Ensure userId is defined and available
        data: updates,
      });

    res.status(200).json({
      message: 'User updated successfully',
      user: {
        id: updatedUser.id,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        email: updatedUser.email,
        phoneNumber: updatedUser.phoneNumber,
        avatar: updatedUser.avatar,
        updatedAt: updatedUser.updatedAt,
      },
    });
  } catch (error) {
    console.error('Error updating user:', error);

    if (error.message.includes('validation')) {
        res.status(400).json({ error: 'Bad request: Data validation failed.' });
    } else if (error.message.includes('unique constraint')) {
        res.status(409).json({ error: 'Conflict: Duplicate data detected.' });
    } else {
        res.status(422).json({ error: 'Unprocessable Entity: Unable to process your request.' });
    }
  }
}

export default updateHandler;
