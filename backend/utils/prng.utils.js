import crypto from 'crypto';

function sha256(data) {
    return crypto.createHash('sha256').update(data).digest()
}

function keyToSeed(key) {
    const hash = sha256(key);
    let seed = hash.readUInt32BE(0) ^ hash.readUInt32BE(4) ^ hash.readUInt32BE(8) ^ hash.readUInt32BE(12) ^ hash.readUInt32BE(16) ^ hash.readUInt32BE(20) ^ hash.readUInt32BE(24) ^ hash.readUInt32BE(28);

    return seed >>> 0; 
}

function XORShift(seed) {
    let state = seed;
    if (state === 0) {
        state = 1;
    }
    state ^= state << 13;
    state ^= state >> 17;
    state ^= state << 5;
    
    return state >>> 0;
}

export { keyToSeed, XORShift };