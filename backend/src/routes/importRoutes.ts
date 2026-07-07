import { Router } from 'express';
import multer from 'multer';
import {
  handleJsonImport,
  handleFileImport,
  healthCheck,
} from '../controllers/importController';
import { importRateLimiter } from '../middleware/rateLimiter';

const router = Router();

// Configure multer for file uploads (5MB max)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === 'text/csv' || file.originalname.toLowerCase().endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Only .csv files are accepted'));
    }
  },
});

// Health check
router.get('/health', healthCheck);

// Import via JSON body (parsed CSV data)
router.post('/import', importRateLimiter, handleJsonImport);

// Import via file upload
router.post('/import/file', importRateLimiter, upload.single('file'), handleFileImport);

export default router;
