import { jest } from '@jest/globals';

const mockLsbEmbed = jest.fn();
const mockDctEmbed = jest.fn();

jest.unstable_mockModule('../../services/embeddings.services/lsb.services.js', () => ({
  lsbEmbed: mockLsbEmbed,
}));

jest.unstable_mockModule('../../services/embeddings.services/dct.services.js', () => ({
  dctEmbed: mockDctEmbed,
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

function makeReq(overrides = {}) {
  return {
    file: { path: 'uploads/temp/img.png' },
    body: { message: 'hello', lsbType: 'sequential' },
    ...overrides,
  };
}

describe('embeddingsController', () => {
  let controller;

  beforeAll(async () => {
    const mod = await import('../../controllers/embeddings.controller.js');
    controller = mod.default;
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('lsbEmbedding', () => {
    it('returns 200 with stegged and difference URLs on success', async () => {
      mockLsbEmbed.mockResolvedValue({
        imageEmbeddedPath: 'uploads/stegged/out.png',
        differenceMapPath: 'uploads/stegged/diff.png',
      });

      const req = makeReq();
      const res = makeRes();
      await controller.lsbEmbedding(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ steggedUrl: expect.any(String), differenceUrl: expect.any(String) })
      );
    });

    it('returns 400 when no image file is provided', async () => {
      const { existsSync } = await import('fs');
      existsSync.mockReturnValueOnce(false);

      const req = makeReq({ file: undefined });
      const res = makeRes();
      await controller.lsbEmbedding(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('returns 400 when no message is provided', async () => {
      const req = makeReq({ body: { lsbType: 'sequential' } });
      const res = makeRes();
      await controller.lsbEmbedding(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: expect.stringMatching(/message/i) })
      );
    });

    it('returns 400 when an invalid lsbType is given', async () => {
      const req = makeReq({ body: { message: 'hi', lsbType: 'invalid' } });
      const res = makeRes();
      await controller.lsbEmbedding(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: expect.stringMatching(/invalid lsb type/i) })
      );
    });

    it('returns 400 when random mode is used without a secret key', async () => {
      const req = makeReq({ body: { message: 'hi', lsbType: 'random' } });
      const res = makeRes();
      await controller.lsbEmbedding(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: expect.stringMatching(/secret key/i) })
      );
    });

    it('returns 200 when random mode is used WITH a secret key', async () => {
      mockLsbEmbed.mockResolvedValue({
        imageEmbeddedPath: 'uploads/stegged/out.png',
        differenceMapPath: 'uploads/stegged/diff.png',
      });

      const req = makeReq({ body: { message: 'hi', lsbType: 'random', secretKey: 'abc123' } });
      const res = makeRes();
      await controller.lsbEmbedding(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('returns 500 when the lsbEmbed service throws', async () => {
      mockLsbEmbed.mockRejectedValue(new Error('service failure'));

      const req = makeReq();
      const res = makeRes();
      await controller.lsbEmbedding(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });

    it('normalises Windows backslash paths to forward slashes in URL', async () => {
      mockLsbEmbed.mockResolvedValue({
        imageEmbeddedPath: 'uploads\\stegged\\out.png',
        differenceMapPath: 'uploads\\stegged\\diff.png',
      });

      const req = makeReq();
      const res = makeRes();
      await controller.lsbEmbedding(req, res);

      const { steggedUrl, differenceUrl } = res.json.mock.calls[0][0];
      expect(steggedUrl).not.toContain('\\');
      expect(differenceUrl).not.toContain('\\');
    });
  });

  describe('dctEmbedding', () => {
    it('returns 200 with stegged and difference URLs on success', async () => {
      mockDctEmbed.mockResolvedValue({
        outputPath: 'uploads/stegged/out.png',
        differenceMapPath: 'uploads/stegged/diff.png',
      });

      const req = makeReq();
      const res = makeRes();
      await controller.dctEmbedding(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ steggedUrl: expect.any(String), differenceUrl: expect.any(String) })
      );
    });

    it('returns 400 when no image file is provided', async () => {
      const { existsSync } = await import('fs');
      existsSync.mockReturnValueOnce(false);

      const req = makeReq({ file: undefined });
      const res = makeRes();
      await controller.dctEmbedding(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('returns 400 when no message is provided', async () => {
      const req = makeReq({ body: {} });
      const res = makeRes();
      await controller.dctEmbedding(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('returns 500 when dctEmbed service throws', async () => {
      mockDctEmbed.mockRejectedValue(new Error('dct failure'));

      const req = makeReq();
      const res = makeRes();
      await controller.dctEmbedding(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('adaptiveEmbedding', () => {
    it('returns 501 not implemented', async () => {
      const req = makeReq();
      const res = makeRes();
      await controller.adaptiveEmbedding(req, res);

      expect(res.status).toHaveBeenCalledWith(501);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: expect.stringMatching(/not implemented/i) })
      );
    });
  });
});