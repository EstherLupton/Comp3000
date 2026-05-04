import { jest } from '@jest/globals';

const mockCalculateLsb      = jest.fn();
const mockCalculateDct      = jest.fn();
const mockValidateCapacity  = jest.fn();
const mockValidateImage     = jest.fn();

jest.unstable_mockModule('../../services/validation.services/image.validation.services.js', () => ({
  calculateImageCapacityLsb: mockCalculateLsb,
  calculateImageCapacityDct: mockCalculateDct,
  validateImageCapacity:     mockValidateCapacity,
  validateImage:             mockValidateImage,
}));

const mockReadFile = jest.fn();
jest.unstable_mockModule('fs/promises', () => ({
  default: { readFile: mockReadFile },
  readFile: mockReadFile,
}));


function makeRes() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json   = jest.fn().mockReturnValue(res);
  return res;
}

describe('imageController', () => {
  let controller;

  beforeAll(async () => {
    const mod = await import('../../controllers/image.controllers.js');
    controller = mod.default;
  });

  beforeEach(() => jest.clearAllMocks());


  describe('imageCapacity', () => {
    it('uses LSB capacity by default and returns 200', async () => {
      mockCalculateLsb.mockResolvedValue({ capacityBits: 8000, capacityChars: 1000 });

      const req = { file: { path: 'img.png' }, body: {} };
      const res = makeRes();
      await controller.imageCapacity(req, res);

      expect(mockCalculateLsb).toHaveBeenCalledWith('img.png');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        capacity: { bits: 8000, characters: 1000 },
      });
    });

    it('uses DCT capacity when embedMethod is "dct"', async () => {
      mockCalculateDct.mockResolvedValue({ capacityBits: 4000, capacityChars: 500 });

      const req = { file: { path: 'img.png' }, body: { embedMethod: 'dct' } };
      const res = makeRes();
      await controller.imageCapacity(req, res);

      expect(mockCalculateDct).toHaveBeenCalledWith('img.png');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        capacity: { bits: 4000, characters: 500 },
      });
    });

    it('returns 400 when the service throws', async () => {
      mockCalculateLsb.mockRejectedValue(new Error('read error'));

      const req = { file: { path: 'img.png' }, body: {} };
      const res = makeRes();
      await controller.imageCapacity(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'read error' });
    });
  });

  describe('validateCapacity', () => {
    it('returns 200 with capacity result', async () => {
      mockValidateCapacity.mockResolvedValue(true);

      const req = { file: { path: 'img.png' }, body: { message: 'hi' } };
      const res = makeRes();
      await controller.validateCapacity(req, res);

      expect(mockValidateCapacity).toHaveBeenCalledWith('img.png', 'hi');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ capacity: true });
    });

    it('defaults to empty string when no message is provided', async () => {
      mockValidateCapacity.mockResolvedValue(false);

      const req = { file: { path: 'img.png' }, body: {} };
      const res = makeRes();
      await controller.validateCapacity(req, res);

      expect(mockValidateCapacity).toHaveBeenCalledWith('img.png', '');
    });

    it('returns 400 when the service throws', async () => {
      mockValidateCapacity.mockRejectedValue(new Error('capacity error'));

      const req = { file: { path: 'img.png' }, body: {} };
      const res = makeRes();
      await controller.validateCapacity(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe('validateImageUpload', () => {
    it('returns 400 when no file is uploaded', async () => {
      const req = { file: undefined, body: {} };
      const res = makeRes();
      await controller.validateImageUpload(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: expect.stringMatching(/no image/i) })
      );
    });

    it('returns 200 when file passes validation', async () => {
      const fakeBuffer = Buffer.from('fake image data');
      mockReadFile.mockResolvedValue(fakeBuffer);
      mockValidateImage.mockResolvedValue(undefined); 
      
      const req = {
        file: { path: 'img.png', originalname: 'img.png', mimetype: 'image/png' },
        body: {},
      };
      const res = makeRes();
      await controller.validateImageUpload(req, res);

      expect(mockValidateImage).toHaveBeenCalledWith(fakeBuffer, 'img.png', 'image/png');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ message: 'Image upload is valid.' });
    });

    it('returns 400 when validateImage throws a validation error', async () => {
      mockReadFile.mockResolvedValue(Buffer.from('data'));
      mockValidateImage.mockRejectedValue(new Error('Invalid image format'));

      const req = {
        file: { path: 'bad.bmp', originalname: 'bad.bmp', mimetype: 'image/bmp' },
        body: {},
      };
      const res = makeRes();
      await controller.validateImageUpload(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'Invalid image format' });
    });

    it('returns 400 when readFile fails', async () => {
      mockReadFile.mockRejectedValue(new Error('disk read error'));

      const req = {
        file: { path: 'img.png', originalname: 'img.png', mimetype: 'image/png' },
        body: {},
      };
      const res = makeRes();
      await controller.validateImageUpload(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });
});