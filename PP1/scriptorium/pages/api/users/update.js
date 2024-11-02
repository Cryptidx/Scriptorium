import bcrypt from 'bcrypt';
import prisma from '../../../lib/prisma'; // Database client
import { isValidPassword, isValidEmail, isValidPhoneNumber } from '../../../lib/validate';
import { performChecks, isAuthenticated } from '../../../lib/auth'; // Import authentication check and middleware wrapper
import uploadMiddleware from '../../../lib/upload'; // File upload middleware
import { isAllowedFileType } from '../../../lib/fileTypeChecker'; // Import the file type checker

const saltRounds = 10;

const allowedMimeTypesForUpdate = [
    'image/png',
    'image/jpeg',
    'image/jpg', 
    'application/pdf',
  ];

async function hashPassword(password) {
  return await bcrypt.hash(password, saltRounds);
}

const updateHandler = uploadMiddleware; // Initialize with file upload middleware

// Main handler logic for updating user details
updateHandler.put(async (req, res) => {
  const userId = req.userId; // Use the userId set by isAuthenticated middleware

  // Check if a file is provided and its type is allowed for this route
  if (req.file && !isAllowedFileType(req.file, allowedMimeTypesForUpdate)) {
    return res.status(400).json({ error: 'Only PNG, JPEG, JPG and PDF files are allowed for custom avatar images!' });
  }

  const { firstName, lastName, password, confirmPassword, email, phoneNumber, role } = req.body;
  let updates = {};

  // Check if at least one field is provided
  const hasUpdateField = [
    firstName, 
    lastName, 
    password, 
    email, 
    phoneNumber, 
    role, 
    req.file, // Check if a file is provided
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
    updates.email = email;
  }
  if (phoneNumber) {
    if (!isValidPhoneNumber(phoneNumber)) {
      return res.status(400).json({
        error: 'Phone number must contain only numbers and be 10 to 15 digits long.',
      });
    }
    updates.phoneNumber = phoneNumber;
  }
  if (role) updates.role = role;

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

  // Handle file upload if an avatar is provided
  if (req.file) {
    updates.avatar = `/uploads/${req.file.filename}`; // Store the file path for the avatar
  }

  try {
    // Update user in the database
    const updatedUser = await prisma.user.update({
      where: { id: userId },
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
        role: updatedUser.role,
        avatar: updatedUser.avatar,
        updatedAt: updatedUser.updatedAt,
      },
    });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ error: 'User update failed.' });
  }
});

// Use performChecks to ensure only authenticated users can access this route
export default performChecks(updateHandler, isAuthenticated);

export const config = {
  api: {
    bodyParser: false, // Disable body parser to allow Multer to handle form data
  },
};
