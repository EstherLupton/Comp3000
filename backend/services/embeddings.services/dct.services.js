import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import fsPromises from 'fs/promises';
import { v4 as uuidv4 } from 'uuid';
import { validateImageCapacityDct } from '../validation.services/image.validation.services.js';
import { pngToJpg } from '../../utils/convert.utils.js';
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
        jpgImage = await fs.promises.readFile(imagePath); 
    }

    const { pixels, messageBinary } = await validateImageCapacityDct(jpgImage, hiddenData);
    
    const { data, info } = pixels;

    
    const fileId = uuidv4();
    const newPixels = new Uint8Array(data);

    const outputDirectory = 'uploads/originals';
    if (!fs.existsSync(outputDirectory)) {
        fs.mkdirSync(outputDirectory, { recursive: true });
    }
    const originalPath = path.join(outputDirectory, `original_${fileId}.png`);
    await sharp(data, { raw: { width: info.width, height: info.height, channels: 3 } }).toColorspace('srgb').png({ compressionLevel: 9, adaptiveFiltering: false }).toFile(originalPath);

    // newPixels = embedDctPng(pixels, messageBinary);
    // imageEmbeddedPath = await createImageFromPixelsPng(newPixels, pixels.info, fileId);
    // differenceMapPath = await differenceMapPng(originalPath, imageEmbeddedPath, fileId);
    let dataIndex = 0;

    for (let i = 0; i < info.height; i += 8) {
        for (let j = 0; j < info.width; j += 8) {
            if (i + 8 > info.height || j + 8 > info.width) continue;

            if (dataIndex >= messageBinary.length) continue;

            const block = getBlock(data, j, i, info.width);
            const r = block.map(row => row.map(pixel => pixel[0]));

            const dctR = applyForwardDct(r);
            const quantR = quantize(dctR);

            const bit = parseInt(messageBinary[dataIndex]);
            let dcCoeff = Math.round(quantR[0][0]);

            if (bit === 1) {
                dcCoeff = Math.floor(dcCoeff / 4) * 4 + 2;
            } else {
                dcCoeff = Math.floor(dcCoeff / 4) * 4;
            }

            quantR[0][0] = dcCoeff;
            dataIndex++;

            const invR = applyInverseDct(dequantize(quantR));

            for (let bi = 0; bi < 8; bi++) {
                for (let bj = 0; bj < 8; bj++) {
                    const idx = ((i + bi) * info.width + (j + bj)) * 3;
                    newPixels[idx] = Math.max(0, Math.min(255, Math.round(invR[bi][bj] + 128)));
                }
            }
        }
    }

    const steggedDirectory = 'uploads/stegged';
    if (!fs.existsSync(steggedDirectory)) {
        fs.mkdirSync(steggedDirectory, { recursive: true });
    }
    const outputPath = path.join(steggedDirectory, `stegged_${fileId}.png`);
    let differenceMapPath;

    try {
        await sharp(Buffer.from(newPixels), {
            raw: { width: info.width, height: info.height, channels: 3 }
        })
            .toColorspace('srgb')
            .png({ compressionLevel: 9, adaptiveFiltering: false })
            .toFile(outputPath);

        differenceMapPath = await differenceMap(originalPath, outputPath, fileId);

        await emptyTempFolder();
    } finally {
        fs.unlinkSync(originalPath);
    }

    return { outputPath, differenceMapPath };
}

async function differenceMap(originalImagePath, steggedImagePath, fileId) {
    const [meta, buffer1, buffer2] = await Promise.all([
        sharp(originalImagePath).metadata(),
        sharp(originalImagePath).removeAlpha().toColorspace('srgb').raw().toBuffer(),
        sharp(steggedImagePath).removeAlpha().toColorspace('srgb').raw().toBuffer()
    ]);

    const { width, height } = meta;
    const channels = 3; 
    const differenceData = new Uint8Array(buffer1.length);
    const THRESHOLD = 2;

    for (let i = 0; i < buffer1.length; i += channels) {
        let maxDiff = 0;
        for (let c = 0; c < channels; c++) {
            const diff = Math.abs(buffer1[i + c] - buffer2[i + c]);
            if (diff > maxDiff) maxDiff = diff;
        }

        if (maxDiff > THRESHOLD) {
            const intensity = Math.min(255, 150 + maxDiff * 5);
            differenceData[i] = intensity; // Red channel
            differenceData[i + 1] = 0; //Green
            differenceData[i + 2] = 0; // Blue
        } else {
            differenceData[i] = buffer1[i];
            differenceData[i + 1] = buffer1[i + 1];
            differenceData[i + 2] = buffer1[i + 2];
        }
    }

    const directory = 'uploads/differenceMap';
    if (!fs.existsSync(directory)) fs.mkdirSync(directory, { recursive: true });

    const outputPath = path.join(directory, `difference_${fileId}.png`);

    await sharp(differenceData, { raw: { width, height, channels } })
        .toColorspace('srgb')
        .png({ compressionLevel: 9, adaptiveFiltering: false })
        .toFile(outputPath);

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

export { dctEmbed };
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

// function writeBlockPng(data, x, y, width, rBlock, gBlock, bBlock) {
//      for (let i = 0; i < 8; i++) {
//         for (let j = 0; j < 8; j++) {
//             const index = ((y + i) * width + (x + j)) * 3;

//             data[index] = Math.max(0, Math.min(255, Math.round(rBlock[i][j] + 128)));
//             data[index + 1] = Math.max(0, Math.min(255, Math.round(gBlock[i][j] + 128)));
//             data[index + 2] = Math.max(0, Math.min(255, Math.round(bBlock[i][j] + 128)));
//         }
//     }
// }

// async function differenceMapPng(originalImagePath, steggedImagePath, fileId) {
//     const original = sharp(originalImagePath);
//     const stegged = sharp(steggedImagePath);

//     const [meta, buffer1, buffer2] = await Promise.all([
//         original.metadata(),
//         original.raw().toBuffer(),
//         stegged.raw().toBuffer()
//     ]);

//     const { width, height, channels } = meta;
//     const differenceData = new Uint8Array(buffer1.length);

//     const THRESHOLD = 2;

//     for (let i = 0; i < buffer1.length; i += channels) {
//         let maxDiff = 0;

//         for (let c = 0; c < channels; c++) {
//             if (channels === 4 && c === 3) continue;

//             const diff = Math.abs(buffer1[i + c] - buffer2[i + c]);
//             if (diff > maxDiff) maxDiff = diff;
//         }

//         if (maxDiff > THRESHOLD) {
//             const highlight = Math.min(255, 150 + (maxDiff * 5));
//             differenceData[i] = highlight;     // Red channel
//             differenceData[i + 1] = 0;         // Green
//             differenceData[i + 2] = 0;         // Blue
//         } else {
//             differenceData[i] = Math.floor(buffer1[i] * 0.15);
//             differenceData[i + 1] = Math.floor(buffer1[i + 1] * 0.15);
//             differenceData[i + 2] = Math.floor(buffer1[i + 2] * 0.15);
//         }

//         if (channels === 4) differenceData[i + 3] = 255;
//     }

//     const directory = 'uploads/differenceMap';
//     if (!fs.existsSync(directory)) fs.mkdirSync(directory, { recursive: true });

//     const outputPath = path.join(directory, `difference_${fileId}.png`);

//     await sharp(differenceData, {
//         raw: { width, height, channels }
//     }).toFile(outputPath);

//     return outputPath;
// }
