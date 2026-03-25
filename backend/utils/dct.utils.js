export function getBlock(data, x, y, width, channels = 3) {
    const block = [];
    for (let i = 0; i < 8; i++) {
        const row = [];
        for (let j = 0; j < 8; j++) {
            const index = ((y + i) * width + (x + j)) * channels;
            row.push([
                data[index] - 128,     // Red
                data[index + 1] - 128, // Green
                data[index + 2] -128 // Blue
            ]);
        }
        block.push(row);
    }
    return block;
}

export function applyForwardDct(block) {
    const n = 8
    const result = Array.from({ length: n }, () => new Array(n).fill(0));

    for (let i = 0; i < n; i++){
        for (let j = 0; j < n; j++){
            let sum = 0;

            for (let k = 0; k < n; k++) {
                for (let l = 0; l < n; l++) {
                    sum += block[k][l] * Math.cos((2 * k + 1) * i * Math.PI / 16) * Math.cos((2 * l + 1) * j * Math.PI / 16)
                    
                }
            }
            const alphaI = i === 0 ? 1 / Math.sqrt(8) : Math.sqrt(2 / 8);
            const alphaJ = j === 0 ? 1 / Math.sqrt(8) : Math.sqrt(2 / 8);
            result[i][j] = alphaI * alphaJ * sum;
        }
    }
    return result;
}

export function quantize(block) {
    return block.map((row, i) => row.map((value, j) => {
        return Math.round(value / quantMatrix[i][j]);
    }));
}

const quantMatrix = [
    [16, 11, 10, 16, 24, 40, 51, 61],
    [12, 12, 14, 19, 26, 58, 60, 55],
    [14, 13, 16, 24, 40, 57, 69, 56],
    [14, 17, 22, 29, 51, 87, 80, 62],
    [18, 22, 37, 56, 68, 109, 103, 77],
    [24, 35, 55, 64, 81, 104, 113, 92],
    [49, 64, 78, 87, 103, 121, 120, 101],
    [72, 92, 95, 98, 112, 100, 103, 99]
];

export function dequantize(block) {
    return block.map((row, i) => row.map((value, j) => {
        return value * quantMatrix[i][j];
    }));
}

export function applyInverseDct(coeff) {
    const n = 8
    const result = Array.from({ length: n }, () => new Array(n).fill(0));
    for (let i = 0; i < n; i++){
        for (let j = 0; j < n; j++){
            let sum = 0;

            for (let k = 0; k < n; k++) {
                for (let l = 0; l < n; l++){
                    const alphaK = k === 0 ? 1 / Math.sqrt(8) : Math.sqrt(2 / 8);
                    const alphaL = l === 0 ? 1 / Math.sqrt(8) : Math.sqrt(2 / 8);
                    sum += alphaK * alphaL * coeff[k][l] * 
                           Math.cos((2 * i + 1) * k * Math.PI / 16) * 
                           Math.cos((2 * j + 1) * l * Math.PI / 16);
                }
            }
            result[i][j] = sum;
        }
    }
    return result;
}