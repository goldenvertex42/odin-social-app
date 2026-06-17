import multer from 'multer';

// Use memoryStorage so raw file buffers are held temporarily in RAM
// This prevents leftover temporary junk files from clogging up your server disk space
const storage = multer.memoryStorage();

export const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB max payload security restriction
  },
  fileFilter: (req, file, cb) => {
    // Lock down accepted uploads strictly to clean web-ready image variants
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type allocation format. Images only!'), false);
    }
  }
});
