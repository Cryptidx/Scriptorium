// import multer from 'multer';
// import path from 'path';

// // Configure Multer storage settings
// const storage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, path.join(process.cwd(), 'uploads')); // Save files in the 'uploads' directory
//   },
//   filename: (req, file, cb) => {
//     cb(null, `${Date.now()}-${file.originalname}`); // Generate a unique filename
//   },
// });

// // Initialize Multer with the storage configuration
// const upload = multer({ storage });

// // Disable body parsing to handle form-data
// export const config = {
//   api: {
//     bodyParser: false,
//   },
// };

// export default async function handler(req, res) {
//   // Only allow POST requests
//   if (req.method === 'POST') {
//     try {
//       // Use a promise to handle Multer's callback style
//       await new Promise((resolve, reject) => {
//         upload.single('file')(req, res, (err) => {
//           if (err) return reject(err);
//           resolve();
//         });
//       });

//       // Check if a file was uploaded
//       if (!req.file) {
//         return res.status(400).json({ error: 'No file uploaded.' });
//       }

//       // Successfully uploaded file
//       res.status(200).json({
//         message: 'File uploaded successfully',
//         filePath: `/uploads/${req.file.filename}`, // File path
//       });
//     } catch (error) {
//       console.error('Error uploading file:', error);
//       res.status(500).json({ error: 'Failed to upload file' });
//     }
//   } else {
//     res.setHeader('Allow', ['POST']);
//     res.status(405).json({ error: `Method ${req.method} not allowed` });
//   }
// }
