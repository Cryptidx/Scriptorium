import fs from 'fs';
import path from 'path';

const publicAvatarDir = path.join(process.cwd(), 'public/avatar_images');

/**
 * Get all files for a user, including public avatar images.
 * @param {string} userId - ID of the user whose files to fetch.
 * @returns {Promise<Array<string>>} - List of file paths accessible by the user.
 */
export async function getUserFilesWithAvatars(userId) {
  try {
    // User-specific directory
    const userDir = path.join(process.cwd(), 'public/uploads', String(userId));
    
    // Ensure the user directory exists, and fetch its files
    let userFiles = [];
    if (fs.existsSync(userDir)) {
      userFiles = fs.readdirSync(userDir).map(file => `/uploads/${userId}/${file}`);
    }

    // Fetch public avatar images
    let publicAvatars = [];
    if (fs.existsSync(publicAvatarDir)) {
      publicAvatars = fs.readdirSync(publicAvatarDir).map(file => `/avatar_images/${file}`);
    }

    // Combine user files and public avatars
    return [...userFiles, ...publicAvatars];
  } catch (error) {
    console.error('Error fetching user files and avatars:', error);
    throw new Error('Failed to fetch files');
  }
}
