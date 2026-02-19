import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import seedrandom from 'seedrandom';
import { validateImageCapacity } from '../validation.services/image.validation.services.js';

async function lsbEmbed(imagePath, hiddenData, lsbType = { mode: "sequential", secretKey: null }) {
    const { pixels, messageBinary } = await validateImageCapacity(imagePath, hiddenData);
    let newPixels;

    if (lsbType.mode === "random" && lsbType.secretKey) {
        newPixels = embedRandomly(pixels, messageBinary, lsbType.secretKey, pixels.info.channels);
    } else if (lsbType.mode === "sequential") {
        newPixels = embedSequentially(pixels, messageBinary, pixels.info.channels);
    } else {
        throw new Error("Invalid LSB embedding mode");
    }

    const imageEmbedded = createImageFromPixels(newPixels, pixels.info);
    return imageEmbedded;
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


function messageToBinary(message) {
    let binaryMessage = '';
    for (let i = 0; i < message.length; i++) {
        const asciiValue = message.charCodeAt(i);
        binaryMessage += asciiValue.toString(2).padStart(8, '0');
    }
    return binaryMessage;
}

async function createImageFromPixels(pixelData, info) {
    const { width, height, channels } = info;
    const outputDirectory = 'uploads/stegged';
    if (!fs.existsSync(outputDirectory)) {
        fs.mkdirSync(outputDirectory, { recursive: true });
    }
    const outputPath = path.join(outputDirectory, 'stegged_' + Date.now() + '.png');

    const newImage = sharp(Buffer.from(pixelData), {
        raw: { width, height, channels }
    });

    await newImage.toFile(outputPath);
    return outputPath;
}

function shuffleArray(array, secretKey) {
    const rng = seedrandom(secretKey);
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(rng() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

export { lsbEmbed, messageToBinary };  
