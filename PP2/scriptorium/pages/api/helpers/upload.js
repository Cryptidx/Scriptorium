import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import multer from 'multer';

export const config = {
  api: {
    bodyParser: false,
  },
};

// Configure Multer storage
const storage = multer.memoryStorage();
const upload = multer({ storage }).single('file');

const handler = async (req, res) => {
  if (req.method === 'POST') {
    try {
      // Use Multer to parse the multipart form data
      await new Promise((resolve, reject) => {
        upload(req, res, (err) => {
          if (err) return reject(err);
          resolve();
        });
      });

      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      const buffer = req.file.buffer;

      // Validate and process the image with sharp
      let processedBuffer;
      try {
        processedBuffer = await sharp(buffer)
          .toFormat('jpeg') // Ensure format matches the detected MIME type
          .toBuffer();
      } catch (error) {
        return res.status(400).json({ error: 'Invalid or corrupted image file' });
      }

      // Save the processed file
      const uploadDir = path.join(process.cwd(), 'public/uploads');
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      const filePath = path.join(uploadDir, `uploaded-file-${Date.now()}.jpg`);
      fs.writeFileSync(filePath, processedBuffer);

      res.status(200).json({
        message: 'File uploaded successfully!',
        filePath: `/uploads/${path.basename(filePath)}`,
      });
    } catch (error) {
      res.status(500).json({ error: `Failed to upload file: ${error.message}` });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).json({ error: `Method ${req.method} not allowed` });
  }
};

export default handler;
