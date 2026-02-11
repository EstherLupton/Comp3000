import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

async function lsbEmbed(imagePath, hiddenData){
    const image = sharp(imagePath);
    const pixels = await image.raw().toBuffer({ resolveWithObject: true });
    let messageBinary = messageToBinary(hiddenData);
    messageBinary += "1111111111111110"; 

    const channels = pixels.info.channels;
    const maxCapacity = channels === 4? (pixels.data.length / 4) * 3 : pixels.data.length; 
    if (messageBinary.length > maxCapacity) {
        throw new Error('Message too long to embed in image');
    }

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

    const imageEmbedded = createImageFromPixels(newPixels, pixels.info);
    return imageEmbedded;
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

export default lsbEmbed  
