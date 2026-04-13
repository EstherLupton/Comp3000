import sharp from 'sharp';
import { messageToBinary } from '../../utils/convert.utils.js'

export async function validateImage(fileBuffer, fileName) {
    if (!fileBuffer || !fileName || fileBuffer.length === 0) {
        throw new Error('Image not found');
    }

    const allowedExtensions = ['jpg', 'jpeg', 'png', 'bmp'];
    const fileExtension = fileName.split('.').pop().toLowerCase();
    if (!allowedExtensions.includes(fileExtension)) {
        throw new Error('Unsupported image format');
    }

    let metadata;
    let image;
    try {
        image = sharp(fileBuffer); 
        metadata = await image.metadata();
    } catch (err) {
        throw new Error('Corrupted image file');
    }

    const maxWidth = 5000;
    const maxHeight = 5000;
    const maxFileSize = 5 * 1024 * 1024;

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

export async function validateImageCapacityDct(imagePath, hiddenData) {
    const image = sharp(imagePath);
    const pixels = await image.raw().toBuffer({ resolveWithObject: true });
    const { width, height } = pixels.info;
    const blocksWide = Math.floor(width / 8);
    const blocksHigh = Math.floor(height / 8);
    const totalBlocks = blocksWide * blocksHigh;
    const usableBlocks = Math.floor(totalBlocks / 3);
    const capacityBits = usableBlocks;
    let messageBinary = messageToBinary(hiddenData);
    messageBinary += "1111111111111110";
    if (messageBinary.length > capacityBits) {
        throw new Error("Message too long to embed in image");
    }

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
    const image = sharp(imagePath);
    const pixels = await image.raw().toBuffer({ resolveWithObject: true });

    const { width, height } = pixels.info;

    const blocksWide = Math.floor(width / 8);
    const blocksHigh = Math.floor(height / 8);
    const totalBlocks = blocksWide * blocksHigh;
    const usableBlocks = Math.floor(totalBlocks / 3);

    const capacityBits = usableBlocks;

    const availableBits = Math.max(0, capacityBits - 16);
    
    const capacityChars = Math.floor(availableBits / 8);

    return { 
        capacityBits: availableBits, 
        capacityChars,
        totalBlocks,
        usableBlocks
    };
}

