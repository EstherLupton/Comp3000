import sharp from 'sharp';

async function validateImage(fileBuffer, fileName) {
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

export default {
    validateImage
};