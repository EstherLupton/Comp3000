export function messageToBinary(message) {
    const encoder = new TextEncoder();
    const encodedMessage = encoder.encode(message);
    
    let binaryMessage = '';
    for (const byte of encodedMessage) {
        binaryMessage += byte.toString(2).padStart(8, '0');
    }
    return binaryMessage;
}

export function binaryToText(binaryMessage) {
    const bytes = [];

    for (let i = 0; i < binaryMessage.length; i += 8) {
        const byte = binaryMessage.slice(i, i + 8);
        if (byte.length === 8) {
            bytes.push(parseInt(byte, 2));
        }
    }

    const decoder = new TextDecoder();
    return decoder.decode(new Uint8Array(bytes));
}
