import sharp from 'sharp';
import { messageToBinary } from '../../utils/convert.utils.js'

export async function validateImage(fileBuffer, fileName, mimeType) {
    if (!fileBuffer || !fileName || fileBuffer.length === 0) {
        throw new Error('Image not found');
    }

    const allowedExtensions = ['jpg', 'jpeg', 'png', 'bmp'];
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/bmp'];
    const fileExtension = fileName.split('.').pop().toLowerCase();    

    if (!allowedExtensions.includes(fileExtension)) {
        throw new Error('Unsupported image format');
    }

    if (!allowedMimeTypes.includes(mimeType)) {
        throw new Error('Invalid file type. Only JPEG, PNG, and BMP are allowed.');
    }

    let metadata;
    let image;
    try {
        image = sharp(fileBuffer); 
        metadata = await image.metadata();
    } catch (err) {
        throw new Error('Corrupted image file');
    }

    const maxWidth = 10000;
    const maxHeight = 10000;
    const maxFileSize = 60 * 1024 * 1024; // 60 Mb

    if (metadata.width > maxWidth || metadata.height > maxHeight) {
        throw new Error('Image dimensions exceed allowed limits');
    }

    if (fileBuffer.length > maxFileSize) {
        throw new Error('Image file size exceeds allowed limit');
    }

    const expectedUncompressedSize = metadata.width * metadata.height * (metadata.channels || 3);
    const { data: rawBuffer } = await image.raw().toBuffer({ resolveWithObject: true });
    if (rawBuffer.length !== expectedUncompressedSize) {
        throw new Error('Image uncompressed size is inconsistent with metadata');
    }

    return { success: true };
}

export async function validateImageCapacity(imagePath, hiddenData) {

    const image = sharp(imagePath);
    const pixels = await image.raw().toBuffer({ resolveWithObject: true });

    const { width, height, channels } = pixels.info;

    const usableChannels = channels === 4 ? 3 : channels;
    const capacityBits = (width * height * usableChannels) - 16;

    let messageBinary = messageToBinary(hiddenData);
    messageBinary += "1111111111111110";

    if (messageBinary.length > capacityBits) {
        throw new Error("Message too long to embed in image");
    }

    return { pixels, messageBinary };
}

export async function validateImageCapacityDct(imagePathOrBuffer, hiddenData) {
    const { data, info } = await sharp(imagePathOrBuffer).removeAlpha().toColorspace('srgb').raw().toBuffer({ resolveWithObject: true });

    const { width, height } = info;

    const blocksWide = Math.floor(width / 8);
    const blocksHigh = Math.floor(height / 8);
    const totalBlocks = blocksWide * blocksHigh;

    const DELIMITER_BITS = 16;
    const capacityBits = Math.max(0, totalBlocks - DELIMITER_BITS);

    let messageBinary = messageToBinary(hiddenData);
    messageBinary += "1111111111111110";

    if (messageBinary.length > capacityBits) {
        throw new Error(`Message too long to embed in image. Required: ${messageBinary.length} bits, Available: ${capacityBits} bits`);
    }

    const pixels = { data, info };
    return { pixels, messageBinary };
}

export async function calculateImageCapacityLsb(imagePath) {
    const image = sharp(imagePath);
    const pixels = await image.raw().toBuffer({ resolveWithObject: true });

    const { width, height, channels } = pixels.info;

    const usableChannels = channels === 4 ? 3 : channels;

    const capacityBits = (width * height * usableChannels) - 16;
    const capacityChars = Math.floor(capacityBits / 8);

    return { capacityBits, capacityChars };
}

export async function calculateImageCapacityDct(imagePath) {
    const { info } = await sharp(imagePath).removeAlpha().toColorspace('srgb').raw().toBuffer({ resolveWithObject: true });

    const { width, height } = info;

    const blocksWide = Math.floor(width / 8);
    const blocksHigh = Math.floor(height / 8);
    const totalBlocks = blocksWide * blocksHigh;
    const DELIMITER_BITS = 16;
    const capacityBits = Math.max(0, totalBlocks - DELIMITER_BITS);
    const capacityChars = Math.floor(capacityBits / 8);

    return {
        capacityBits: capacityBits,
        capacityChars,
        totalBlocks,
        usableBlocks: capacityBits
    };
}

