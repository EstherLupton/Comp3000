import sharp from 'sharp';
import fs, { write } from 'fs';
import path, { parse } from 'path';
import { v4 as uuidv4 } from 'uuid'
import { validateImageCapacity} from '../validation.services/image.validation.services.js';
import { messageToBinary } from '../../utils/convert.utils.js';
import { differenceMap } from '../embeddings.services/lsb.services.js';
import { get } from 'http';
import { getBlock, applyForwardDct, quantize, dequantize, applyInverseDct } from '../../utils/dct.utils.js';

/**
 * The DCT algorithm used in this service is based on the "Shield Algorithm" proposed in:
 * Bansal, D., & Chhikara, R. (2014). An Improved DCT based Steganography Technique. 
 * International Journal of Computer Applications, 102(14), 46-49.
 * https://scispace.com/pdf/an-improved-dct-based-steganography-technique-kp4xyp407g.pdf
 */


async function dctEmbed(imagePath, hiddenData){
    const { pixels, messageBinary } = await validateImageCapacity(imagePath, hiddenData);
    const fileId = uuidv4();
    let newPixels;

    const outputDirectory = 'uploads/originals';
    if (!fs.existsSync(outputDirectory)) {
        fs.mkdirSync(outputDirectory, { recursive: true });
    }
    const originalPath = path.join(outputDirectory, `original_${fileId}.png`);
    await sharp(imagePath).toFile(originalPath);

    newPixels = embedDct(pixels, messageBinary);
    
    const imageEmbeddedPath = await createImageFromPixels(newPixels, pixels.info, fileId);
    const differenceMapPath = await differenceMap(originalPath, imageEmbeddedPath, fileId);

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

                if (dataIndex === 0) {
                    const testDequant = dcCoeff * 16; 
                }
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


export { dctEmbed };