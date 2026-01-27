import express from 'express';
import {uploadOriginals} from '../middlewares/upload.middleware.js';
import imagesController from '../controllers/images.controller.js';

const router = express.Router();

router.post('/upload', uploadOriginals.single('image'), imagesController.uploadImage);
router.get('/:id', imagesController.getImageById);
router.delete('/:id', imagesController.deleteImageById);

module.exports = router;