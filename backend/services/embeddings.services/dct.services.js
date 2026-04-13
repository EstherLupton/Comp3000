import sharp from 'sharp';
import fs, { write } from 'fs';
import path, { parse } from 'path';
import { v4 as uuidv4 } from 'uuid'
import { validateImageCapacityDct} from '../validation.services/image.validation.services.js';
import { pngToJpg } from '../../utils/convert.utils.js';
import { get } from 'http';
import { getBlock, applyForwardDct, quantize, dequantize, applyInverseDct } from '../../utils/dct.utils.js';

/**
 * The DCT algorithm used in this service is based on the "Shield Algorithm" proposed in:
 * Bansal, D., & Chhikara, R. (2014). An Improved DCT based Steganography Technique. 
 * International Journal of Computer Applications, 102(14), 46-49.
 * https://scispace.com/pdf/an-improved-dct-based-steganography-technique-kp4xyp407g.pdf
 */


async function dctEmbed(imagePath, hiddenData) {
    let jpgImage;
    const ext = path.extname(imagePath).toLowerCase();
    if (ext === '.png') {
        jpgImage = await pngToJpg(await fs.promises.readFile(imagePath));
    } else {
        jpgImage = imagePath
    }

    const { pixels, messageBinary } = await validateImageCapacityDct(jpgImage, hiddenData);
    const fileId = uuidv4();
    let newPixels;

    const outputDirectory = 'uploads/originals';
    if (!fs.existsSync(outputDirectory)) {
        fs.mkdirSync(outputDirectory, { recursive: true });
    }
    const originalPath = path.join(outputDirectory, `original_${fileId}.png`);
    await sharp(jpgImage).toFile(originalPath);

    let differenceMapPath;
    let imageEmbeddedPath;

    // newPixels = embedDctPng(pixels, messageBinary);
    // imageEmbeddedPath = await createImageFromPixelsPng(newPixels, pixels.info, fileId);
    // differenceMapPath = await differenceMapPng(originalPath, imageEmbeddedPath, fileId);
    newPixels = embedDct(pixels, messageBinary);
    
    imageEmbeddedPath = await createImageFromPixels(newPixels, pixels.info, fileId);
    differenceMapPath = await differenceMap(originalPath, imageEmbeddedPath, fileId);

    return {imageEmbeddedPath, differenceMapPath}
}

function embedDct(pixels, messageBinary) {
    let dataIndex = 0;
    const newPixels = new Uint8Array(pixels.data);

    for (let i = 0; i < pixels.info.height; i += 8) { 
        for (let j = 0; j < pixels.info.width; j += 8) {
            if (i + 8 > pixels.info.height || j + 8 > pixels.info.width) continue;

            let block = getBlock(pixels.data, j, i, pixels.info.width);

            let r = block.map(row => row.map(pixel => pixel[0]));
            let g = block.map(row => row.map(pixel => pixel[1]));
            let b = block.map(row => row.map(pixel => pixel[2]));

            let dctR = applyForwardDct(r);
            let quantR = quantize(dctR);

            if (dataIndex < messageBinary.length) {
                let bit = parseInt(messageBinary[dataIndex]);
                let dcCoeff = Math.round(quantR[0][0]);

                if (bit === 1) {
                    dcCoeff = (Math.floor(dcCoeff / 4) * 4) + 2; 
                } else {
                    dcCoeff = Math.floor(dcCoeff / 4) * 4;
                }
                quantR[0][0] = dcCoeff;
                dataIndex++;
            }
            let invR = applyInverseDct(dequantize(quantR));
            let invG = applyInverseDct(dequantize(quantize(applyForwardDct(g))));
            let invB = applyInverseDct(dequantize(quantize(applyForwardDct(b))));

            writeBlock(newPixels, j, i, pixels.info.width, invR, invG, invB);
        }
    }
    return newPixels;
}  

// function embedDctPng(pixels, messageBinary) {
//     let dataIndex = 0;
//     const newPixels = new Uint8Array(pixels.data);
//     const QUANT_STEP = 4;

//     console.log("Starting DCT embedding for PNG...");
//     console.log("Image dimensions:", pixels.info.width, "x", pixels.info.height);
//     console.log("Message binary length:", messageBinary.length);

//     for (let i = 0; i < pixels.info.height; i += 8) { 
//         for (let j = 0; j < pixels.info.width; j += 8) {
//             if (i + 8 > pixels.info.height || j + 8 > pixels.info.width) continue;
            
//             let block = getBlock(pixels.data, j, i, pixels.info.width);       

//             let r = block.map(row => row.map(pixel => pixel[0]));
//             let g = block.map(row => row.map(pixel => pixel[1]));
//             let b = block.map(row => row.map(pixel => pixel[2]));

//             console.log(`Processing block at (${i}, ${j})`);
//             console.log("Red channel block:", r);
//             console.log("Green channel block:", g);
//             console.log("Blue channel block:", b);

//             let dctR = applyForwardDct(r);

//             if (dataIndex < messageBinary.length) {
//                 let bit = parseInt(messageBinary[dataIndex]);
//                 let dcCoeff = dctR[0][0];

//                 let rounded = Math.round(dcCoeff);
//                 if (bit === 1) {
//                     dctR[0][0] = (rounded % 2 === 0) ? rounded + 1 : rounded;
//                 } else {
//                     dctR[0][0] = (rounded % 2 !== 0) ? rounded - 1 : rounded;
//                 }
//                 dataIndex++;
//             }

//             let invR = applyInverseDct(dctR).map(row => row.map(value => Math.max(0, Math.min(255, value))));
//             let invG = applyInverseDct(applyForwardDct(g)).map(row => row.map(value => Math.max(0, Math.min(255, value))));
//             let invB = applyInverseDct(applyForwardDct(b)).map(row => row.map(value => Math.max(0, Math.min(255, value))));

//             console.log("Clamped Inverse DCT Red channel block:", invR);
//             console.log("Clamped Inverse DCT Green channel block:", invG);
//             console.log("Clamped Inverse DCT Blue channel block:", invB);

//             writeBlockPng(newPixels, j, i, pixels.info.width, invR, invG, invB);
//         }
//     }

//     console.log("DCT embedding for PNG completed.");
//     return newPixels;
// }

async function createImageFromPixels(pixelData, info, fileId) {
    const { width, height } = info; 
    const channels = 3; 
    
    const outputDirectory = 'uploads/stegged';
    if (!fs.existsSync(outputDirectory)) {
        fs.mkdirSync(outputDirectory, { recursive: true });
    }
    const outputPath = path.join(outputDirectory, `stegged_${fileId}.png`);

    const newImage = sharp(Buffer.from(pixelData), {
        raw: { width, height, channels }
    })
    .toColorspace('srgb') 
    .png({ compressionLevel: 9, adaptiveFiltering: false })
    .toFile(outputPath);

    await newImage;
    return outputPath;   
}

// async function createImageFromPixelsPng(pixelData, info, fileId) {
//     const { width, height } = info; 
//     const channels = 3;

//     const outputDirectory = 'uploads/stegged';
//     if (!fs.existsSync(outputDirectory)) {
//         fs.mkdirSync(outputDirectory, { recursive: true });
//     }
//     const outputPath = path.join(outputDirectory, `stegged_${fileId}.png`);

//     const newImage = sharp(Buffer.from(pixelData), {
//         raw: { width, height, channels }
//     })
//     .toColorspace('srgb') 
//     .png({ compressionLevel: 9, adaptiveFiltering: false })
//     .toFile(outputPath);

//     await newImage;
//     return outputPath;   
// }

function writeBlock(data, x, y, width, rBlock, gBlock, bBlock) {
    for (let i = 0; i < 8; i++) {
        for (let j = 0; j < 8; j++) {

            const index = ((y + i) * width + (x + j)) * 3;

            if (x === 0 && y === 0) {
                const rawValue = rBlock[0][0] + 128;
            }

            data[index] = Math.max(0, Math.min(255, Math.round(rBlock[i][j] + 128)));
            data[index + 1] = Math.max(0, Math.min(255, Math.round(gBlock[i][j] + 128)));
            data[index + 2] = Math.max(0, Math.min(255, Math.round(bBlock[i][j] + 128)));
        }
    }
}

function writeBlockPng(data, x, y, width, rBlock, gBlock, bBlock) {
     for (let i = 0; i < 8; i++) {
        for (let j = 0; j < 8; j++) {
            const index = ((y + i) * width + (x + j)) * 3;

            data[index] = Math.max(0, Math.min(255, Math.round(rBlock[i][j] + 128)));
            data[index + 1] = Math.max(0, Math.min(255, Math.round(gBlock[i][j] + 128)));
            data[index + 2] = Math.max(0, Math.min(255, Math.round(bBlock[i][j] + 128)));
        }
    }
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

    const THRESHOLD = 2; 

    for (let i = 0; i < buffer1.length; i += channels) {
        let maxDiff = 0;

        for (let c = 0; c < channels; c++) {
            if (channels === 4 && c === 3) continue;

            const diff = Math.abs(buffer1[i + c] - buffer2[i + c]);
            if (diff > maxDiff) maxDiff = diff;
        }

        if (maxDiff > THRESHOLD) {
            const highlight = Math.min(255, 150 + (maxDiff * 5));
            
            differenceData[i] = highlight;     // Red channel
            differenceData[i + 1] = 0;         // Green
            differenceData[i + 2] = 0;         // Blue
        } else {
            differenceData[i] = Math.floor(buffer1[i] * 0.15);
            differenceData[i + 1] = Math.floor(buffer1[i + 1] * 0.15);
            differenceData[i + 2] = Math.floor(buffer1[i + 2] * 0.15);
        }

        if (channels === 4) differenceData[i + 3] = 255;
    }

    const directory = 'uploads/differenceMap';
    if (!fs.existsSync(directory)) fs.mkdirSync(directory, { recursive: true });

    const outputPath = path.join(directory, `difference_${fileId}.png`);

    await sharp(differenceData, {
        raw: { width, height, channels }
    }).toFile(outputPath);

    return outputPath;
}

async function differenceMapPng(originalImagePath, steggedImagePath, fileId) {
    const original = sharp(originalImagePath);
    const stegged = sharp(steggedImagePath);

    const [meta, buffer1, buffer2] = await Promise.all([
        original.metadata(),
        original.raw().toBuffer(),
        stegged.raw().toBuffer()
    ]);

    const { width, height, channels } = meta;
    const differenceData = new Uint8Array(buffer1.length);

    const THRESHOLD = 2;

    for (let i = 0; i < buffer1.length; i += channels) {
        let maxDiff = 0;

        for (let c = 0; c < channels; c++) {
            if (channels === 4 && c === 3) continue;

            const diff = Math.abs(buffer1[i + c] - buffer2[i + c]);
            if (diff > maxDiff) maxDiff = diff;
        }

        if (maxDiff > THRESHOLD) {
            const highlight = Math.min(255, 150 + (maxDiff * 5));
            differenceData[i] = highlight;     // Red channel
            differenceData[i + 1] = 0;         // Green
            differenceData[i + 2] = 0;         // Blue
        } else {
            differenceData[i] = Math.floor(buffer1[i] * 0.15);
            differenceData[i + 1] = Math.floor(buffer1[i + 1] * 0.15);
            differenceData[i + 2] = Math.floor(buffer1[i + 2] * 0.15);
        }

        if (channels === 4) differenceData[i + 3] = 255;
    }

    const directory = 'uploads/differenceMap';
    if (!fs.existsSync(directory)) fs.mkdirSync(directory, { recursive: true });

    const outputPath = path.join(directory, `difference_${fileId}.png`);

    await sharp(differenceData, {
        raw: { width, height, channels }
    }).toFile(outputPath);

    return outputPath;
}

export { dctEmbed };