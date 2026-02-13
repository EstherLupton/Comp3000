import express from 'express';
import cors from 'cors';
import embeddingsController from './controllers/embeddings.controller.js';
import analysisController from './controllers/analyses.controller.js';
import { uploadSteggedImage, uploadAnalysis } from './middleware/upload.middleware.js';
import imageController from './controllers/image.controllers.js';

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static("uploads"));

app.get('/health', (req, res) => res.json({ status: 'Backend running' }));

app.post('/lsb', uploadSteggedImage.single('image'), embeddingsController.lsbEmbedding);
app.post('/dct', uploadSteggedImage.single('image'), embeddingsController.dctEmbedding);
app.post('/adaptive', uploadSteggedImage.single('image'), embeddingsController.adaptiveEmbedding);

app.post('/capacity', uploadSteggedImage.single('image'), imageController.imageCapacity);


app.post('/extract/lsb', uploadAnalysis.single('image'), analysisController.lsbAnalyses);
app.post('/extract/dct', uploadAnalysis.single('image'), analysisController.dctAnalyses);
app.post('/extract/adaptive', uploadAnalysis.single('image'), analysisController.adaptiveAnalyses);

app.listen(PORT, () => console.log(`Backend listening on http://localhost:${PORT}`));