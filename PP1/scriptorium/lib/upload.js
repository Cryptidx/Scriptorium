import multer from 'multer';
import handler from './handler';
import path from 'path'; 

// Configure storage with Multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Set the uploads folder at the same level as the lib folder
    cb(null, path.join(process.cwd(), 'uploads'));
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

// Initialize Multer with the storage settings and file filter
const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const allowedMimeTypes = [
      'image/png', 
      'image/jpeg', 
      'image/jpg', 
      'application/pdf', 
      'text/x-c', 
      'text/x-java-source', 
      'application/javascript',
      'text/x-python',
    ];
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('File type not allowed'), false);
    }
  },
});

// Create a middleware handler with nextConnect and apply the Multer middleware
const uploadMiddleware =  handler(); // Initialize the handler;
uploadMiddleware.use(upload.single('file')); // Use 'file' as the form field name

export default uploadMiddleware;

export const config = {
  api: {
    bodyParser: false, // Disable body parser to let Multer handle file data
  },
};
