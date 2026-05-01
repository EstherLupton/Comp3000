import sharp from 'sharp';
import fs from 'fs';
import fsPromises from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid'
import { keyToSeed, XORShift } from '../../utils/prng.utils.js';
import { validateImageCapacity } from '../validation.services/image.validation.services.js';
import { messageToBinary } from '../../utils/convert.utils.js';

async function lsbEmbed(imagePath, hiddenData, lsbType = { mode: "sequential", secretKey: null }) {
    const { pixels, messageBinary } = await validateImageCapacity(imagePath, hiddenData);
    const fileId = uuidv4();
    let newPixels;

    const outputDirectory = 'uploads/originals';
    if (!fs.existsSync(outputDirectory)) {
        fs.mkdirSync(outputDirectory, { recursive: true });
    }
    const originalPath = path.join(outputDirectory, `original_${fileId}.png`);
    try {
    await sharp(imagePath).toFile(originalPath);
    } finally {
        if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath);
    }

    if (lsbType.mode === "random" && lsbType.secretKey) {
        newPixels = embedRandomly(pixels, messageBinary, lsbType.secretKey, pixels.info.channels);
    } else if (lsbType.mode === "sequential") {
        newPixels = embedSequentially(pixels, messageBinary, pixels.info.channels);
    } else {
        throw new Error("Invalid LSB embedding mode");
    }

    const imageEmbeddedPath = await createImageFromPixels(newPixels, pixels.info, fileId);
    const differenceMapPath = await differenceMap(originalPath, imageEmbeddedPath, fileId);

    await emptyTempFolder();

    return {imageEmbeddedPath, differenceMapPath}
}

function embedSequentially(pixels, messageBinary, channels) {
    let dataIndex = 0;
    let newPixels = new Uint8Array(pixels.data.length);
    for (let i = 0; i < pixels.data.length; i++) {
        if ( channels === 4 && i % 4 === 3 ) {
            newPixels[i] = pixels.data[i];
            continue;
        }
        if (dataIndex < messageBinary.length) {
            let pixelByte = pixels.data[i];
            let bit = messageBinary[dataIndex];
            pixelByte = (pixelByte & 0xFE) | parseInt(bit);
            newPixels[i] = pixelByte;
            dataIndex++;
        } else {
            newPixels[i] = pixels.data[i];
        }
    }
    return newPixels;
}

function embedRandomly(pixels, messageBinary, secretKey, channels) {
    const array = Array.from({ length: pixels.data.length }, (_, i) => i);
    shuffleArray(array, secretKey);

    let dataIndex = 0;
    let newPixels = new Uint8Array(pixels.data);

    for (let i = 0; i < array.length && dataIndex < messageBinary.length; i++) {
        const index = array[i];
        if (channels === 4 && index % 4 === 3) {
            continue;
        }
        let pixelByte = pixels.data[index];
        let bit = messageBinary[dataIndex];
        pixelByte = (pixelByte & 0xFE) | parseInt(bit);
        newPixels[index] = pixelByte;
        dataIndex++;
    }
    return newPixels;
}

async function createImageFromPixels(pixelData, info, fileId) {
    const { width, height, channels } = info;
    const outputDirectory = 'uploads/stegged';
    if (!fs.existsSync(outputDirectory)) {
        fs.mkdirSync(outputDirectory, { recursive: true });
    }
    const outputPath = path.join(outputDirectory, `stegged_${fileId}.png`);

    const newImage = sharp(Buffer.from(pixelData), {
        raw: { width, height, channels }
    });

    await newImage.toFile(outputPath);
    return outputPath;   
}

function shuffleArray(array, secretKey) {
    let seed = keyToSeed(secretKey);
    for (let i = array.length - 1; i > 0; i--) {
        seed = XORShift(seed);
        const randomFloat = seed / 4294967296;
        const j = Math.floor(randomFloat * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

async function differenceMap(originalImagePath, steggedImagePath, fileId) {

    const original = sharp(originalImagePath);
    const stegged = sharp(steggedImagePath);

    const [meta, buffer1, buffer2] = await Promise.all([
        original.metadata(),
        original.raw().toBuffer(),
        stegged.raw().toBuffer()
    ]);

    const { width, height, channels } = meta;

    const differenceData = new Uint8Array(buffer1.length);

    for (let i = 0; i < buffer1.length; i += channels) {

        let changedChannels = 0;

        for (let c = 0; c < channels; c++) {

            if (channels === 4 && c === 3) continue; // skip alpha

            const originalLSB = buffer1[i + c] & 1;
            const stegoLSB = buffer2[i + c] & 1;

            if (originalLSB !== stegoLSB) {
                changedChannels++;
            }
        }

        if (changedChannels > 0) {

            // intensity based on number of channels changed
            const intensity = Math.floor((changedChannels / 3) * 255);

            differenceData[i] = 255;              // strong red
            differenceData[i + 1] = 255 - intensity;
            differenceData[i + 2] = 255 - intensity;

        } else {

            differenceData[i] = buffer1[i];
            differenceData[i + 1] = buffer1[i + 1];
            differenceData[i + 2] = buffer1[i + 2];

        }

        if (channels === 4) {
            differenceData[i + 3] = buffer1[i + 3];
        }
    }

    const directory = 'uploads/differenceMap';
    if (!fs.existsSync(directory)) fs.mkdirSync(directory, { recursive: true });

    const outputPath = path.join(directory, `difference_${fileId}.png`);

    await sharp(differenceData, {
        raw: { width, height, channels }
    }).toFile(outputPath);

    return outputPath;
}

async function emptyTempFolder() {
    try {
        const tempPath = path.resolve('uploads/temp');

        const files = await fsPromises.readdir(tempPath);

        for (const file of files) {
            const filePath = path.join(tempPath, file);
            await fsPromises.rm(filePath, { recursive: true, force: true });
        }

        console.log('Temp folder cleared');
    } catch (err) {
        console.error('Error clearing temp folder:', err);
    }
}

export { lsbEmbed, differenceMap };