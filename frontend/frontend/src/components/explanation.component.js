import React from 'react';
import CryptoJS from 'crypto-js';

import originalHiddenPixels from './exampleImages/originalHiddenPixels.png';
import dctHighDataMap from './exampleImages/dctHighDataMap.png';
import dctHighStegged from './exampleImages/dctHighStegged.png';
import dctLowDataMap from './exampleImages/dctLowDataMap.png';
import dctLowStegged from './exampleImages/dctLowStegged.png';
import dctMediumDataMap from './exampleImages/dctMediumDataMap.png';
import dctMediumStegged from './exampleImages/dctMediumStegged.png';
import lsbHighDataMap from './exampleImages/lsbHighDataMap.png';
import lsbHighStegged from './exampleImages/lsbHighStegged.png';
import lsbLowDataMap from './exampleImages/lsbLowDataMap.png';
import lsbLowStegged from './exampleImages/lsbLowStegged.png';
import lsbMediumDataMap from './exampleImages/lsbMediumDataMap.png';
import lsbMediumStegged from './exampleImages/lsbMediumStegged.png';
import randomHighDataMap from './exampleImages/randomHighDataMap.png';
import randomHighStegged from './exampleImages/randomHighStegged.png';
import randomLowDataMap from './exampleImages/randomLowDataMap.png';
import randomLowStegged from './exampleImages/randomLowStegged.png';
import randomMediumDataMap from './exampleImages/randomMediumDataMap.png';
import randomMediumStegged from './exampleImages/randomMediumStegged.png';

const secretKeyOptions = ['supersecret', 'broooom', 'apparently', 'hello'];
const samplePixelValues = [182, 201, 55, 226, 43, 162, 220, 106];

const alogirthmTabs = [
    { key: 'lsbSequential', label: 'LSB Sequential' },
    { key: 'lsbRandom',     label: 'LSB Random'     },
    { key: 'dct',           label: 'DCT (Frequency)' },
];

const dataVolumeOptions = [
    { value: 'low',  label: 'Low Load'    },
    { value: 'med',  label: 'Medium Load' },
    { value: 'high', label: 'High Load'   },
];

const payloadDescriptions = {
    low:  '20% of image capacity',
    med:  '50% of image capacity',
    high: '95% of image capacity',
};
 
const quantMatrix = [
    [16, 11, 10, 16, 24, 40, 51, 61],
    [12, 12, 14, 19, 26, 58, 60, 55],
    [14, 13, 16, 24, 40, 57, 69, 56],
    [14, 17, 22, 29, 51, 87, 80, 62],
    [18, 22, 37, 56, 68, 109, 103, 77],
    [24, 35, 55, 64, 81, 104, 113, 92],
    [49, 64, 78, 87, 103, 121, 120, 101],
    [72, 92, 95, 98, 112, 100, 103, 99],
];

const exampleImages = {
    lsbSequential: {
        low:  { original: originalHiddenPixels, dataMap: lsbLowDataMap,    stegged: lsbLowStegged    },
        med:  { original: originalHiddenPixels, dataMap: lsbMediumDataMap, stegged: lsbMediumStegged },
        high: { original: originalHiddenPixels, dataMap: lsbHighDataMap,   stegged: lsbHighStegged   },
    },
    lsbRandom: {
        low:  { original: originalHiddenPixels, dataMap: randomLowDataMap,    stegged: randomLowStegged    },
        med:  { original: originalHiddenPixels, dataMap: randomMediumDataMap, stegged: randomMediumStegged },
        high: { original: originalHiddenPixels, dataMap: randomHighDataMap,   stegged: randomHighStegged   },
    },
    dct: {
        low:  { original: originalHiddenPixels, dataMap: dctLowDataMap,    stegged: dctLowStegged    },
        med:  { original: originalHiddenPixels, dataMap: dctMediumDataMap, stegged: dctMediumStegged },
        high: { original: originalHiddenPixels, dataMap: dctHighDataMap,   stegged: dctHighStegged   },
    },
};

function messageToBinary(message) {
    const encoder = new TextEncoder();
    const encodedMessage = encoder.encode(message);

    let binaryString = '';
    for (const byte of encodedMessage) {
        binaryString += byte.toString(2).padStart(8, '0');
    }
    return binaryString;
}

function sha256(binaryData) {
    return CryptoJS.SHA256(binaryData).toString(CryptoJS.enc.Hex);
}

// https://github.com/cprosche/mulberry32
// A seeded psuedorandom number generator which is light weight
function mulberry32(seed) {
    return function () {
        let t = seed += 0x6D2B79F5;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

function keyToSeed(key) {
    const hash = sha256(key);
    let seed = 0;

    for (let i = 0; i < hash.length; i += 8) {
        const chunk = hash.slice(i, i + 8);
        if (chunk) {
            seed ^= parseInt(chunk, 16);
        }
    }
    return seed >>> 0;
}

function pixelColours(hue, saturation, value) {
    const i = Math.floor(hue / 60) % 6;
    const f = hue / 60 - Math.floor(hue / 60);
    const p = value * (1 - saturation);
    const q = value * (1 - f * saturation);
    const t = value * (1 - (1 - f) * saturation);
    const colorChannels = [[value, t, p], [q, value, p], [p, value, t], [p, q, value], [t, p, value], [value, p, q]][i];
    return `rgb(${Math.round(colorChannels[0] * 255)},${Math.round(colorChannels[1] * 255)},${Math.round(colorChannels[2] * 255)})`;
}

const pixelColourList = Array.from({ length: 64 }, (_, index) =>
    pixelColours(
        (index / 64) * 260 + 180,
        0.4 + Math.sin(index * 0.7) * 0.2,
        0.35 + Math.cos(index * 0.5) * 0.1
    )
);

function PixelGrid({ pixelList }) {
    return (
        <div className="pixel-grid">
            {pixelList.map(({ color, isHighlighted, isModified, onClick }, index) => (
                <div
                    key={index}
                    onClick={onClick}
                    className={[
                        'pixel-cell',
                        isModified    ? 'pixel-cell-modified'    : '',
                        isHighlighted ? 'pixel-cell-highlighted' : '',
                        onClick       ? 'pixel-cell-clickable'   : '',
                    ].join(' ')}
                    style={{ background: color }}
                />
            ))}
        </div>
    );
}

function QuantKey({ items }) {
    return (
        <div className="quantKey">
            {items.map(({ color, border, label }) => (
                <div key={label} className="quantKey-item">
                    <div
                        className="quantKey-swatch"
                        style={{ background: color, border: border || 'none' }}
                    />
                    {label}
                </div>
            ))}
        </div>
    );
}

function StepLabel({ children, small, accent }) {
    return (
        <div className={[
            'step-label',
            small  ? 'step-label-small'  : '',
            accent ? 'step-label-accent' : '',
        ].join(' ')}>
            {children}
        </div>
    );
}

function LsbSequentialTab() {
    const [characterCount, setCharacterCount] = React.useState(2);

    const messageBits = messageToBinary(69).split('');
    const bitsUsedCount = characterCount * 8;

    const pixelTableRows = samplePixelValues.map((pixelValue, index) => {
        const originalBits = messageToBinary(pixelValue);
        const messageBit   = messageBits[index];
        const hasChanged   = originalBits[7] !== messageBit;
        const newBits      = originalBits.slice(0, 7) + messageBit;
        return { originalBits, messageBit, hasChanged, newBits };
    });

    const pixelList = pixelColourList.map((color, index) => ({
        color:      index < bitsUsedCount ? '#ff0000' : color,
        isModified: index < bitsUsedCount,
    }));

    return (
        <div className="tab-content">

            {/* Left column */}
            <div>
                <div className="section-title">Step 1: Encode the characters into binary</div>
                <div className="inner-card">
                    <StepLabel>Character → Number → 0s and 1s (Binary)</StepLabel>
                    <div className="encode-row">
                        <span className="encode-character">{'E'}</span>
                        <span className="encode-arrow">→</span>
                        <span className="encode-badge">{'69'}</span>
                        <span className="encode-arrow">→</span>
                        <span className="encode-badge">{messageToBinary('E')}</span>
                    </div>
                </div>

                <div className="section-title">Step 2: Each message bit is hidden by swapping the final bit of a pixel</div>
                <div className="inner-card">
                    <div className="pixel-table-wrapper">
                        <table className="pixel-table">
                            <thead>
                                <tr>
                                    {['Pixel', 'Original bits', 'Character bit', 'New bits'].map(heading => (
                                        <td key={heading}>{heading}</td>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {pixelTableRows.map(({ originalBits, messageBit, hasChanged, newBits }, index) => (
                                    <tr key={index}>
                                        <td className="col-label">P{index + 1}</td>
                                        <td>
                                            {originalBits.slice(0, 7)}
                                            <span className={hasChanged ? 'bit-lsb-original' : ''}>{originalBits[7]}</span>
                                        </td>
                                        <td className="bit-message">{messageBit}</td>
                                        <td>
                                            {newBits.slice(0, 7)}
                                            <span className={hasChanged ? 'bit-changed' : ''}>{newBits[7]}</span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <StepLabel small>The red numbers are the ones which changed, if they didn't change they were already the same as the character bit</StepLabel>
                </div>
            </div>

            {/* Right column */}
            <div>
                <div className="section-title">Pixel Map: where the data goes in the image</div>
                <div className="inner-card">
                    <StepLabel>Red shows modified pixels</StepLabel>
                    <PixelGrid pixelList={pixelList} />
                     <div className="info-box">
                        <span className="info-box-weakness">Weakness:</span> Pixels are modified sequentially, starting in the top-left corner. An attacker can easily check the least significant bit of each pixel in order, and read off the hidden message bit by bit.
                    </div>
                </div>
                <div className="slider-row">
                    <span className="slider-label">Data Load:</span>
                    <input
                        type="range"
                        min={1}
                        max={8}
                        value={characterCount}
                        onChange={e => setCharacterCount(Number(e.target.value))}
                    />
                    <span className="slider-value">
                        {characterCount} Character{characterCount > 1 ? 's' : ''}
                    </span>
                </div>
            </div>
        </div>
    );
}

function LsbRandomTab() {
    const [selectedSecretKey, setSelectedSecretKey] = React.useState('supersecret');
    const [characterCount, setCharacterCount] = React.useState(2);

    const randomNumberGenerator = mulberry32(keyToSeed(selectedSecretKey));
    const scrambledPixelOrder   = Array.from({ length: pixelColourList.length }, (_, index) => index)
        .sort(() => randomNumberGenerator() - 0.5);
    const modifiedPixelIndices  = new Set(scrambledPixelOrder.slice(0, characterCount * 8));

    const pixelList = pixelColourList.map((color, index) => ({
        color:      modifiedPixelIndices.has(index) ? '#ff0000' : color,
        isModified: modifiedPixelIndices.has(index),
    }));

    return (
        <div className="tab-content">

            {/* Left column */}
            <div>
                <div className="section-title">How the key scrambles pixel order</div>
                <div className="inner-card">
                    <StepLabel>Secret key → Unique pattern → Mix up where data is hidden</StepLabel>
                    <div className="key-row">
                        <div className="key-display">{selectedSecretKey}</div>
                        <span className="encode-arrow">→</span>
                        <div className="key-indices">
                            {scrambledPixelOrder.slice(0, 9).map((pixelIndex, index) => (
                                <div key={index} className="key-index">{pixelIndex}</div>
                            ))}
                            <span className="key-ellipsis">…</span>
                        </div>
                    </div>
                </div>

                <div className="inner-card">
                    <StepLabel>Different keys change the random order:</StepLabel>
                    <div className="button" style={{ marginTop: 8 }}>
                        {secretKeyOptions.map(keyOption => (
                            <button
                                key={keyOption}
                                className={selectedSecretKey === keyOption ? 'active' : ''}
                                onClick={() => setSelectedSecretKey(keyOption)}
                            >
                                {keyOption}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="info-box">
                    <span className="info-box-strength">Strength:</span> Even if someone knows data is hidden, they cannot read it without the exact secret key used to scramble the pixel order.
                </div>
            </div>

            {/* Right column */}
            <div>
                <div className="section-title">Pixel Map: where the data goes in the image</div>
                <div className="inner-card">
                    <StepLabel>Red shows modified pixels</StepLabel>
                    <PixelGrid pixelList={pixelList} />
                    <div className="slider-row" style={{ marginTop: 12 }}>
                        <span className="slider-label">Data Load:</span>
                        <input
                            type="range"
                            min={1}
                            max={8}
                            value={characterCount}
                            onChange={e => setCharacterCount(Number(e.target.value))}
                        />
                        <span className="slider-value">
                            {characterCount} Character{characterCount > 1 ? 's' : ''}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}

function DctTab() {
    const [embeddedBit, setEmbeddedBit] = React.useState(1);
 
    const blockPixelList = pixelColourList.map((color, index) => ({
        color
    }));
 
    return (
        <div className="tab-content">
 
            {/* Left column */}
            <div>
                <div className="section-title">Step 1: Image is split into 8×8 pixel blocks</div>
                <div className="inner-card">
                    <StepLabel>Each block carries one hidden bit. One message bit per block.</StepLabel>
                    <PixelGrid pixelList={blockPixelList} />
                </div>
            </div>
 
            {/* Right column */}
            <div>
                <div className="section-title">Step 3: Embed bit into the DC coefficient</div>
                <div className="inner-card">
                    <StepLabel>
                        The quantised DC coefficient is rounded to the nearest multiple of 4,
                        then left at a multiple for a 0-bit or offset by 2 for a 1-bit.
                    </StepLabel>
 
                    <div className="encode-row" style={{ marginTop: 10 }}>
                        <span className="step-label" style={{ marginBottom: 0 }}>DC before:</span>
                        <span className="encode-badge">-2</span>
                        <span className="encode-arrow">→</span>
                        <span className="step-label" style={{ marginBottom: 0 }}>embed bit:</span>
                        <div className="button" style={{ flexDirection: 'row', gap: 6 }}>
                            <button
                                className={embeddedBit === 0 ? 'active' : ''}
                                onClick={() => setEmbeddedBit(0)}
                                style={{ padding: '2px 14px' }}
                            >0</button>
                            <button
                                className={embeddedBit === 1 ? 'active' : ''}
                                onClick={() => setEmbeddedBit(1)}
                                style={{ padding: '2px 14px' }}
                            >1</button>
                        </div>
                        <span className="encode-arrow">→</span>
                        <span className="step-label" style={{ marginBottom: 0 }}>DC after:</span>
                        <span
                            className="encode-badge"
                            style={{ borderColor: embeddedBit === 0 ? '#3fb950' : undefined, color: embeddedBit === 0 ? '#3fb950' : undefined }}
                        >
                          {embeddedBit === 0 ? "-4" : "-2"}
                            </span>
                    </div>
                </div>
                <div className="info-box">
                    <span className="info-box--info">Why the DC coefficient?</span>{' '}
                    The DC coefficient represents the average brightness of the entire 8×8 block.
                    Rounding it to a multiple of 4 shifts the whole block's brightness by at most
                    ±2, a change so small the human eye can't detect it, but recoverable on decode.
                </div>
            </div>

            <div className="full-width">
             <div className="section-title">Step 2: Forward DCT + quantisation</div>
                <div className="inner-card">
                  <div className="dct-section">
                    <div className='dct-text'>
                      <StepLabel>
                          Before any maths we adjust the brightness of the pixels. Standard 
                          colour values range from 0 to 255. Subtracting 128 from every pixel 
                          shifts the range to -128 to 127. This centers the values around zero,
                          which is crucial for the DCT to work effectively. Instead of looking
                          at the image as as grid of dots, we transform it into a grid of patterns
                          (frequencies). Low frequencies (smooth gradients and overall brightness) 
                          are in the top-left, high frequencies (fine details, sharp edges) in the
                          bottom-right. We divided each frequency by a "quantisation divisor" from 
                          the quantisation matrix, this reduces the precision, and allows us to hide 
                          data in the rounding.
                      </StepLabel>
                        <QuantKey items={[
                          { color: 'rgba(67,97,238,0.3)',  border: '1px solid rgba(67,97,238,0.5)',  label: 'Low Frequency (small divisor)' },
                          { color: 'rgba(220,80,60,0.15)', border: '1px solid rgba(220,80,60,0.35)', label: 'High Frequency (large divisor)' },
                          { color: 'rgba(63,185,80,0.2)',  border: '1px solid #3fb950',              label: 'Direct Current, data is hidden here' },
                      ]} />
                    </div>
                    <div className="dct-visual">
                      <div className="dct-grid" style={{ marginTop: 10 }}>
                          {quantMatrix.flat().map((divisor, index) => {
                              const isDataCell      = index === 0;
                              const frequencyLevel  = (Math.floor(index / 8) + (index % 8)) / 14;
                              const isLowFrequency  = frequencyLevel < 0.3;
                              const isHighFrequency = frequencyLevel > 0.7;
                              const cellClass = isDataCell ? 'dct-cell-data' : isLowFrequency ? 'dct-cell-low-frequency' : isHighFrequency ? 'dct-cell-high-frequency' : '';
                              return (
                                <div key={index} className={`dct-cell ${cellClass}`}>
                                  {divisor}
                                </div>
                              );
                          })}
                      </div>
                    </div>
                  </div>
                </div>
            </div>
        </div>
    );
}


const ExplanationContent = () => {
    const [selectedAlgorithm, setSelectedAlgorithm] = React.useState('lsbSequential');
    const [selectedDataVolume, setSelectedDataVolume] = React.useState('low');

    const currentImageSet = exampleImages[selectedAlgorithm][selectedDataVolume];

    return (
        <div className="explanation-content-wrapper">

            {/* Sidebar */}
            <aside className="explanation-sidebar">
                <div className="glass-card">

                    <div>
                        <div className="label">Algorithm</div>
                        <div className="button">
                            {alogirthmTabs.map(({ key, label }) => (
                                <button
                                    key={key}
                                    className={selectedAlgorithm === key ? 'active' : ''}
                                    onClick={() => setSelectedAlgorithm(key)}
                                >
                                    {label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <div className="label">Data Volume</div>
                        <div className="button">
                            {dataVolumeOptions.map(({ value, label }) => (
                                <button
                                    key={value}
                                    className={selectedDataVolume === value ? 'active' : ''}
                                    onClick={() => setSelectedDataVolume(value)}
                                >
                                    {label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <span className="label explanation-payload-label">
                        {payloadDescriptions[selectedDataVolume]}
                    </span>
                </div>
            </aside>

            {/* Main content */}
            <main className="explanation-main-content">

                {/* Image comparison row */}
                <div className="explanation-preview-grid">
                    {[
                        { label: 'Original Image', src: currentImageSet.original, alt: 'Original image'      },
                        { label: 'Data Map',       src: currentImageSet.dataMap,  alt: 'Data map'            },
                        { label: 'Stegged Result', src: currentImageSet.stegged,  alt: 'Steganographic result' },
                    ].map(({ label, src, alt }) => (
                        <div key={label} className="explanation-preview-column">
                            <span className="label">{label}</span>
                            <div className="explanation-preview-image">
                                <img src={src} alt={alt} />
                            </div>
                        </div>
                    ))}
                </div>

                {/* Interactive explainer */}
                <div className="glass-card explanation-explainer-card">
                    {selectedAlgorithm === 'lsbSequential' && <LsbSequentialTab />}
                    {selectedAlgorithm === 'lsbRandom'     && <LsbRandomTab     />}
                    {selectedAlgorithm === 'dct'           && <DctTab           />}
                </div>
            </main>
        </div>
    );
};

export default ExplanationContent;