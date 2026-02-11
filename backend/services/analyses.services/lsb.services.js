import sharp from 'sharp';
import seedrandom from 'seedrandom';

async function lsbExtract(imagePath, lsbType = {mode: "sequential", secretKey: null}) {
    const image = sharp(imagePath);
    const pixels = await image.raw().toBuffer({ resolveWithObject: true });
    const channels = pixels.info.channels;
    let binaryMessage = '';
    const delimiter = "1111111111111110";

    let message = '';

     if (lsbType.mode === "random" && lsbType.secretKey) {
        message = analyseRandomly(pixels, lsbType.secretKey, channels, delimiter);
    } else if (lsbType.mode === "sequential") {
        message = analyseSequentially(pixels, channels, delimiter);
    } else {
        throw new Error("Invalid LSB analysis mode");
    }
    return message;
}

function analyseSequentially(pixels, channels, delimiter) {
    let binaryMessage = '';
    let message = '';
    for (let i = 0; i < pixels.data.length; i++) {
        if (channels === 4 && i % 4 === 3) continue;
        const bit = pixels.data[i] & 0x01;
        binaryMessage += bit.toString();

        if (binaryMessage.endsWith(delimiter)) {
            binaryMessage = binaryMessage.slice(0, -delimiter.length);
            break;
        }
    }

    for (let i = 0; i < binaryMessage.length; i += 8) {
        const byte = binaryMessage.slice(i, i + 8);
        message += String.fromCharCode(parseInt(byte, 2));
    }

    return message;
}

function analyseRandomly(pixels, secretKey, channels, delimiter) {
    let binaryMessage = '';
    const array = Array.from({ length: pixels.data.length }, (_, i) => i);
    shuffleArray(array, secretKey);

    for (let i = 0; i < array.length; i++) {
        const index = array[i];
        if (channels === 4 && index % 4 === 3) continue;
        const bit = pixels.data[index] & 0x01;
        binaryMessage += bit.toString();

        if (binaryMessage.endsWith(delimiter)) {
            binaryMessage = binaryMessage.slice(0, -delimiter.length);
            break;
        }
    }

    let message = '';
    for (let i = 0; i < binaryMessage.length; i += 8) {
        const byte = binaryMessage.slice(i, i + 8);
        message += String.fromCharCode(parseInt(byte, 2));
    }

    return message;
}

function shuffleArray(array, secretKey) {
    const rng = seedrandom(secretKey);
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(rng() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

export default lsbExtract

