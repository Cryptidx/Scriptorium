const bcrypt = require('bcrypt');

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Execute with: `node create-sys-admin.js`

const saltRounds = 10;

async function main() {
  // Define sys admin details
  const email = 'admin@example.com';
  const password = 'SecurePassword123!';
  const firstName = 'Sys';
  const lastName = 'Admin';
  const phoneNumber = '0000000000'; // Placeholder, adjust if needed
  const role = 'SYS_ADMIN'; // Ensure this matches exactly with your schema

  // Hash the password
  const hashedPassword = await bcrypt.hash(password, saltRounds);

  try {
    // Check if a sys admin user already exists
    const existingSysAdmin = await prisma.user.findFirst({
      where: { role: 'SYS_ADMIN' },
    });

    if (existingSysAdmin) {
      console.log('A sys admin user already exists. Aborting.');
      process.exit(1);
    }

    // Insert the new sys admin user into the database
    const sysAdminUser = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        firstName,
        lastName,
        phoneNumber,
        role,
      },
    });

    console.log('Sys admin created successfully:', {
      id: sysAdminUser.id,
      email: sysAdminUser.email,
      role: sysAdminUser.role,
    });
  } catch (error) {
    console.error('Error creating sys admin:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
