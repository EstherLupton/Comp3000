import request from 'supertest';
import express from 'express';
import { jest } from '@jest/globals';

jest.unstable_mockModule('../middleware/upload.middleware.js', () => {
  const fakeMulter = () => ({
    single: () => (req, _res, next) => {
      req.file = {
        path: 'uploads/temp/test-image.png',
        originalname: 'test-image.png',
        mimetype: 'image/png',
        size: 1024,
      };
      next();
    },
  });
  return {
    uploadSteggedImage: fakeMulter(),
    uploadAnalysis: fakeMulter(),
    uploadOrigionalImage: fakeMulter(),
    uploadReports: fakeMulter(),
  };
});

jest.unstable_mockModule('../controllers/embeddings.controller.js', () => ({
  default: {
    lsbEmbedding:      (_req, res) => res.status(200).json({ steggedUrl: 'http://localhost:5000/out.png', differenceUrl: 'http://localhost:5000/diff.png' }),
    dctEmbedding:      (_req, res) => res.status(200).json({ steggedUrl: 'http://localhost:5000/out.png', differenceUrl: 'http://localhost:5000/diff.png' }),
    adaptiveEmbedding: (_req, res) => res.status(501).json({ message: 'Adaptive embedding not implemented' }),
  },
}));

jest.unstable_mockModule('../controllers/analyses.controller.js', () => ({
  default: {
    lsbAnalyses:      (_req, res) => res.status(200).json({ hiddenData: 'secret' }),
    dctAnalyses:      (_req, res) => res.status(200).json({ hiddenData: 'secret' }),
    adaptiveAnalyses: (_req, res) => res.status(501).json({ message: 'Adaptive analysis not implemented' }),
  },
}));

jest.unstable_mockModule('../controllers/image.controllers.js', () => ({
  default: {
    imageCapacity:       (_req, res) => res.status(200).json({ capacity: { bits: 8000, characters: 1000 } }),
    validateCapacity:    (_req, res) => res.status(200).json({ capacity: true }),
    validateImageUpload: (_req, res) => res.status(200).json({ message: 'Image upload is valid.' }),
  },
}));

async function buildApp() {
  const { default: embeddingsController } = await import('../controllers/embeddings.controller.js');
  const { default: analysisController }   = await import('../controllers/analyses.controller.js');
  const { default: imageController }      = await import('../controllers/image.controllers.js');
  const { uploadSteggedImage, uploadAnalysis } = await import('../middleware/upload.middleware.js');

  const app = express();
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  app.get('/health', (_req, res) => res.json({ status: 'Backend running' }));

  app.post('/lsb',      uploadSteggedImage.single('image'), embeddingsController.lsbEmbedding);
  app.post('/dct',      uploadSteggedImage.single('image'), embeddingsController.dctEmbedding);
  app.post('/adaptive', uploadSteggedImage.single('image'), embeddingsController.adaptiveEmbedding);

  app.post('/capacity',        uploadSteggedImage.single('image'), imageController.imageCapacity);
  app.post('/validate-capacity', uploadSteggedImage.single('image'), imageController.validateCapacity);
  app.post('/validate-image',  uploadSteggedImage.single('image'), imageController.validateImageUpload);

  app.post('/extract/lsb',      uploadAnalysis.single('image'), analysisController.lsbAnalyses);
  app.post('/extract/dct',      uploadAnalysis.single('image'), analysisController.dctAnalyses);
  app.post('/extract/adaptive', uploadAnalysis.single('image'), analysisController.adaptiveAnalyses);

  return app;
}

describe('Routes', () => {
  let app;

  beforeAll(async () => {
    app = await buildApp();
  });

  describe('GET /health', () => {
    it('returns 200 with status message', async () => {
      const res = await request(app).get('/health');
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ status: 'Backend running' });
    });
  });

  describe('POST /lsb', () => {
    it('returns 200 with stegged and difference URLs', async () => {
      const res = await request(app).post('/lsb').field('message', 'hello');
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('steggedUrl');
      expect(res.body).toHaveProperty('differenceUrl');
    });
  });

  describe('POST /dct', () => {
    it('returns 200 with stegged and difference URLs', async () => {
      const res = await request(app).post('/dct').field('message', 'hello');
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('steggedUrl');
      expect(res.body).toHaveProperty('differenceUrl');
    });
  });

  describe('POST /adaptive', () => {
    it('returns 501 not implemented', async () => {
      const res = await request(app).post('/adaptive');
      expect(res.status).toBe(501);
      expect(res.body.message).toMatch(/not implemented/i);
    });
  });

  describe('POST /capacity', () => {
    it('returns 200 with capacity object', async () => {
      const res = await request(app).post('/capacity');
      expect(res.status).toBe(200);
      expect(res.body.capacity).toHaveProperty('bits');
      expect(res.body.capacity).toHaveProperty('characters');
    });
  });

  describe('POST /validate-capacity', () => {
    it('returns 200', async () => {
      const res = await request(app).post('/validate-capacity').field('message', 'hi');
      expect(res.status).toBe(200);
    });
  });

  describe('POST /validate-image', () => {
    it('returns 200 with valid message', async () => {
      const res = await request(app).post('/validate-image');
      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Image upload is valid.');
    });
  });

  describe('POST /extract/lsb', () => {
    it('returns 200 with hiddenData', async () => {
      const res = await request(app).post('/extract/lsb').field('lsbType', 'sequential');
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('hiddenData');
    });
  });

  describe('POST /extract/dct', () => {
    it('returns 200 with hiddenData', async () => {
      const res = await request(app).post('/extract/dct');
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('hiddenData');
    });
  });

  describe('POST /extract/adaptive', () => {
    it('returns 501 not implemented', async () => {
      const res = await request(app).post('/extract/adaptive');
      expect(res.status).toBe(501);
      expect(res.body.message).toMatch(/not implemented/i);
    });
  });
});