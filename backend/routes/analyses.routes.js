import express from 'express';
import anylysisController from '../controllers/analyses.controller.js';
import { uploadOrigionalImage } from '../middleware/upload.middleware.js';

const router = express.Router();

router.post('/lsb', anylysisController.lsbAnalyses);
router.get('/dct', anylysisController.dctAnalyses);
router.post('/adaptive', anylysisController.adaptiveAnalyses);

module.exports = router;
