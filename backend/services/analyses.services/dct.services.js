import sharp from 'sharp';
import { getBlock, applyForwardDct, quantize } from '../../utils/dct.utils.js';
import { binaryToText } from '../../utils/convert.utils.js';

/**
 * The DCT algorithm used in this service is based on the "Shield Algorithm" proposed in:
 * Bansal, D., & Chhikara, R. (2014). An Improved DCT based Steganography Technique. 
 * International Journal of Computer Applications, 102(14), 46-49.
 * https://scispace.com/pdf/an-improved-dct-based-steganography-technique-kp4xyp407g.pdf
 */

async function dctExtract(imagePath) {
    const image = sharp(imagePath);
    const { data, info } = await image.removeAlpha().toColorspace('srgb').raw().toBuffer({ resolveWithObject: true });

    const delimiter = "1111111111111110";
    let binaryMessage = '';

    for (let i = 0; i < info.height; i += 8) {
        for (let j = 0; j < info.width; j += 8) {
            if (i + 8 > info.height || j + 8 > info.width) {
                continue;
            }

            const block = getBlock(data, j, i, info.width);
            const r = block.map(row => row.map(pixel => pixel[0]));

            const dctR = applyForwardDct(r);
            const quantR = quantize(dctR);

            const dcCoeff = Math.round(quantR[0][0]);

            const remainder = ((dcCoeff % 4) + 4) % 4;
            const bit = remainder >= 2 ? '1' : '0';

            binaryMessage += bit;

            if (binaryMessage.endsWith(delimiter)) {
                const message = binaryToText(binaryMessage.slice(0, -delimiter.length));
                return message;
            }
        }
    }

    return binaryToText(binaryMessage);
}

export { dctExtract }