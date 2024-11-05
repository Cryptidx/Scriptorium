// import multer from 'multer';
// import handler from './handler'; // Make sure handler is properly initialized in handler.js
// import path from 'path'; 

// import nextConnect from 'next-connect';

// const handler = nextConnect({
//   onError(error, req, res) {
//     console.error(error);
//     res.status(500).json({ error: 'An unexpected error occurred' });
//   },
//   onNoMatch(req, res) {
//     res.status(404).json({ error: `Route for ${req.method} not found` });
//   },
// });

// // Configure storage with Multer
// const storage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, path.join(process.cwd(), 'uploads')); // Set the uploads folder at the same level as the lib folder
//   },
//   filename: (req, file, cb) => {
//     cb(null, `${Date.now()}-${file.originalname}`);
//   },
// });

// // Initialize Multer with the storage settings and file filter
// const upload = multer({
//   storage,
//   fileFilter: (req, file, cb) => {
//     const allowedMimeTypes = [
//       'image/png', 
//       'image/jpeg', 
//       'image/jpg', 
//       'application/pdf', 
//       'text/x-c', 
//       'text/x-java-source', 
//       'application/javascript',
//       'text/x-python',
//     ];
//     if (allowedMimeTypes.includes(file.mimetype)) {
//       cb(null, true);
//     } else {
//       cb(new Error('File type not allowed'), false);
//     }
//   },
// });

// // Use the initialized `handler` instance and apply the Multer middleware
// handler.use(upload.single('file')); // Use 'file' as the form field name

// export default handler;

// export const config = {
//   api: {
//     bodyParser: false, // Disable body parser to let Multer handle file data
//   },
// };
