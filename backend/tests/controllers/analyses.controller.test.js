import { jest } from '@jest/globals';
import fs from 'fs';

const mockLsbExtract = jest.fn();
const mockDctExtract = jest.fn();

const mockResponse = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

jest.unstable_mockModule('../../services/analyses.services/lsb.services.js', () => ({
  default: mockLsbExtract,
}));

jest.unstable_mockModule('../../services/analyses.services/dct.services.js', () => ({
  dctExtract: mockDctExtract,
}));

jest.unstable_mockModule('fs', () => ({
  default: { existsSync: jest.fn(() => true) },
  existsSync: jest.fn(() => true),
}));

function makeRes() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json   = jest.fn().mockReturnValue(res);
  return res;
}

describe('analysisController', () => {
  let controller;

  beforeAll(async () => {
    const mod = await import('../../controllers/analyses.controller.js');
    controller = mod.default;
  });

  beforeEach(() => jest.clearAllMocks());

  describe('lsbAnalyses', () => {
    it('returns 200 with hiddenData on success', async () => {
      mockLsbExtract.mockResolvedValue('hidden message');

      const req = {
        file: { path: 'uploads/analysis/img.png' },
        body: { lsbType: 'sequential' },
      };
      const res = makeRes();
      await controller.lsbAnalyses(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ hiddenData: 'hidden message' });
    });

    it('falls back to req.body.imagePath when req.file is absent', async () => {
      mockLsbExtract.mockResolvedValue('data');

      const req = { file: undefined, body: { imagePath: 'uploads/analysis/img.png', lsbType: 'sequential' } };
      const res = makeRes();
      await controller.lsbAnalyses(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      // service should have been called with the body path
      expect(mockLsbExtract).toHaveBeenCalledWith(
        'uploads/analysis/img.png',
        expect.any(Object)
      );
    });

    it('returns 400 when neither file nor imagePath is provided', async () => {
      const req = { file: undefined, body: {} };
      const res = makeRes();
      await controller.lsbAnalyses(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: expect.stringMatching(/no image/i) })
      );
    });

    it('returns 400 when an invalid lsbType is given', async () => {
      const req = { file: { path: 'img.png' }, body: { lsbType: 'zigzag' } };
      const res = makeRes();
      await controller.lsbAnalyses(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: expect.stringMatching(/invalid lsb type/i) })
      );
    });

    it('passes secretKey to service when mode is random', async () => {
      mockLsbExtract.mockResolvedValue('data');

      const req = {
        file: { path: 'img.png' },
        body: { lsbType: 'random', secretKey: 'mykey' },
      };
      const res = makeRes();
      await controller.lsbAnalyses(req, res);

      expect(mockLsbExtract).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ mode: 'random', secretKey: 'mykey' })
      );
    });

    it('returns 500 when the lsbExtract service throws', async () => {
      mockLsbExtract.mockRejectedValue(new Error('boom'));

      const req = { file: { path: 'img.png' }, body: { lsbType: 'sequential' } };
      const res = makeRes();
      await controller.lsbAnalyses(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('dctAnalyses', () => {
    it('returns 200 with hiddenData on success', async () => {
      mockDctExtract.mockResolvedValue('dct secret');

      const req = { file: { path: 'uploads/analysis/img.png' }, body: {} };
      const res = makeRes();
      await controller.dctAnalyses(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ hiddenData: 'dct secret' });
    });

    it('returns 400 when no file is provided', async () => {
      const { existsSync } = await import('fs');
      existsSync.mockReturnValueOnce(false);

      const req = { file: undefined, body: {} };
      const res = makeRes();
      await controller.dctAnalyses(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('returns 500 when dctExtract service throws', async () => {
      mockDctExtract.mockRejectedValue(new Error('dct boom'));

      const req = { file: { path: 'uploads/analysis/img.png' }, body: {} };
      const res = makeRes();
      await controller.dctAnalyses(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('adaptiveAnalyses', () => {
    it('returns 501 not implemented', async () => {
      const req = { file: { path: 'img.png' }, body: {} };
      const res = makeRes();
      await controller.adaptiveAnalyses(req, res);

      expect(res.status).toHaveBeenCalledWith(501);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: expect.stringMatching(/not implemented/i) })
      );
    });
  });
});