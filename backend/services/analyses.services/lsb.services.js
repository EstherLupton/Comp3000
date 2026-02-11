import sharp from 'sharp';

async function lsbExtract(imagePath){
    const image = sharp(imagePath);
    const pixels = await image.raw().toBuffer({ resolveWithObject: true });
    const channels = pixels.info.channels;
    let binaryMessage = '';
    const delimiter = "1111111111111110";

    for (let i = 0; i < pixels.data.length; i++) {
        if ( channels === 4 && i % 4 === 3 ) {
            continue;
        }
        const bit = pixels.data[i] & 0x01;
        binaryMessage += bit.toString();

        if (binaryMessage.endsWith(delimiter)) {
            binaryMessage = binaryMessage.slice(0, -delimiter.length);
            break;
        }

    }
    
    let message = '';
    for (let i = 0; i < binaryMessage.length; i += 8) {
        const byte = binaryMessage.slice(i, i + 8);
        const charCode = parseInt(byte, 2);
        message += String.fromCharCode(charCode);
    }

    return message;
}

export default lsbExtract

