import React, { useState } from 'react';
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


const ExplanationContent = () => {
  const [dataLoad, setDataLoad] = useState('low'); 
  const [algorithm, setAlgorithm] = useState('lsbSequential'); 

  const payloadText = {
    low: "20% of image capacity",
    med: "50% of image capacity",
    high: "95% of image capacity"
  };

  const algorithmText = {
    lsbSequential: `The Sequential LSB algorithm is one of the most basic steganography algorithms. LSB stands for least significant bit. This algorithm involves hiding data sequentially in the least significant parts of each pixel within the image.
    Each pixel in an image is made up of three numbers determining how much red, green or blue is that pixel, these numbers each range from 0 to 255. Each of these numbers are converted into binary.
    
    The secret message we want to hide in the image also gets converted into binary using Unicode, which maps a number to each character, then the number gets converted into binary.
    
    The algorithm takes the very last bit (LSB) of each pixels colour value and replaces it with a bit from the secret message. As the change is only 1 unit, like changing a colour value from 254 to 255, the human eye cant detect the difference.
    
    As the algorithm works sequentially, it starts in the op left of the image and changes each pixel one by one, once that line is pixels is full, it goes down to the next, starting at the left again.
    Sequential LSBs biggest flaw is that all the data is stored in the top of the image, in order, making it very easy to detect.`,
    lsbRandom: `Random LSB uses similar techniques to Sequential LSB but instead of storing the data sequentially it stores it randomly.

    The message to hide is converted into binary, each pixel colour value is changed accordingly, however, the pixels chosen to have the data hidden in them is different. 

    Random LSB also requires a secret key, this secret key determines the location of the hidden data. The secret key is turned into a list of numbers by Unicode, then converted into binary. From here mathematical operations are preformed using that secret key and the list of all the pixels stored in the image. The result is a jumbled list of pixels, rather than pixels in order from left to right top to bottom. 

    The data is stored in these random pixels. This is much more secure than Sequential LSB, as even if someone can identify that your image has a hidden message, they wouldn't be able to determine what the message is with it the secret key used to scramble the order of pixels.urity against visual inspection.`,
    dct: `The DCT algorithm doesn't change individual pixels but alters the mathematical frequencies which make up an image. 

First the algorithm splits the image into tiny squares, each square is 8 pixels by 8 pixels, each square is a separate container for a part of the secret message. This is the same size squares when doing JPG compression.

Changing an entire pixel is very visible and not a good place to hide data. So instead we transform each square into the frequency domain using the Discrete Cosine Transformation (DCT).

A way to explain this would be like sheet music. A piece of music can be described as a waveform (pixels), or as notes on a stave (like frequency). The DCT converts between these representations, it doesn't loose any information and is reversable. 

Low frequency means large smooth areas in the block, high frequency means there's lots of fine detail and edges. Modifying a low frequency spreads the change across the entire block evenly, the change is subtle and perceptually uniform. Modifying a high frequency creates sharp changes which are much more visible.

One bit of the secret message gets put into each of the 8 by 8 blocks... `
  };


  const exampleImages = {
  'lsbSequential': {
    low: { original: originalHiddenPixels, dataMap: lsbLowDataMap, stegged: lsbLowStegged },
    med: { original: originalHiddenPixels, dataMap: lsbMediumDataMap, stegged: lsbMediumStegged },
    high: { original: originalHiddenPixels, dataMap: lsbHighDataMap, stegged: lsbHighStegged }
  },
  'lsbRandom': {
    low: { original: originalHiddenPixels, dataMap: randomLowDataMap, stegged: randomLowStegged },
    med: { original: originalHiddenPixels, dataMap: randomMediumDataMap, stegged: randomMediumStegged },
    high: { original: originalHiddenPixels, dataMap: randomHighDataMap, stegged: randomHighStegged }
  },
  'dct': {
    low: { original: originalHiddenPixels, dataMap: dctLowDataMap, stegged: dctLowStegged },
    med: { original: originalHiddenPixels, dataMap: dctMediumDataMap, stegged: dctMediumStegged },
    high: { original: originalHiddenPixels, dataMap: dctHighDataMap, stegged: dctHighStegged }
  }
  };

  const currentSet = exampleImages[algorithm][dataLoad];

  return (
    <div className="explanation-container">
      <div className="explanation-content-wrapper">        
          {/* LEFT SIDEBAR: The Glass Box around Options */}
          <aside className='explanation-sidebar'>
            <aside className="glass-card" style={{ 
              padding: '1.5rem', 
              display: 'flex', 
              gap: '2rem',
              flexShrink: 0,
              justifyContent: 'space-around'
            }}>
              <div>
                <div className="label" style={{ marginBottom: '12px' }}>Algorithm</div>
                  <div className="button" style={{ flexDirection: 'column', width: '100%' }}>
                    <button 
                      className={algorithm === 'lsbSequential' ? "active" : ""} 
                      style={{ width: '100%', textAlign: 'left' }}
                      onClick={() => setAlgorithm('lsbSequential')}
                    >
                      LSB Sequential
                    </button>
                    <button 
                      className={algorithm === 'lsbRandom' ? "active" : ""} 
                      style={{ width: '100%', textAlign: 'left' }}
                      onClick={() => setAlgorithm('lsbRandom')}
                    >
                      LSB Random
                    </button>
                    <button 
                      className={algorithm === 'dct' ? "active" : ""} 
                      style={{ width: '100%', textAlign: 'left' }}
                      onClick={() => setAlgorithm('dct')}
                    >
                    DCT (Frequency)
                    </button>
                </div>

              </div>

              <div>
                <div className="label" style={{ marginBottom: '12px' }}>Data Volume</div>
                  <div className="button" style={{ flexDirection: 'column', width: '100%' }}>
                    <button className={dataLoad === 'low' ? "active" : ""} onClick={() => setDataLoad('low')}>Low Load</button>
                    <button className={dataLoad === 'med' ? "active" : ""} onClick={() => setDataLoad('med')}>Medium Load</button>
                    <button className={dataLoad === 'high' ? "active" : ""} onClick={() => setDataLoad('high')}>High Load</button>
                  </div>
                </div>


                <div style={{alignItems: 'center'}}>
                <span className="label" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%', fontSize: '0.9rem' }}>
                  {payloadText[dataLoad]}
                </span>
              </div>
            </aside>
          </aside>

          {/* RIGHT SIDE: Visual Data View */}
          <main className='explanation-main-content'>
            <div className="preview-grid" style={{ gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
              
              <div className="preview-column">
                <span className="label">Original Image</span>
                <div className="image-container" style={{ width: '100%', height: '220px', borderRadius: '12px', overflow: 'hidden' }}>
                  <img src={currentSet.original} alt="Original Image" style={{ width: '100%', height: '100%' }} />
                </div>
              </div>
              
              <div className="preview-column">
                <span className="label">Data Map</span>
                <div className="image-container" style={{ width: '100%', height: '220px', borderRadius: '12px', overflow: 'hidden' }}>
                  <img src={currentSet.dataMap} alt="Data Map" style={{ width: '100%', height: '100%' }} />
                </div>
              </div>

              <div className="preview-column">
                <span className="label">Stegged Result</span>
                <div className="image-container" style={{ width: '100%', height: '220px', borderRadius: '12px', overflow: 'hidden' }}>
                  <img src={currentSet.stegged} alt="Stegged Result" style={{ width: '100%', height: '100%' }} />
                </div>
              </div>
            </div>
            <div style={{ height: '1.5rem' }}></div>

            <div className="glass-card" >
              <label >Explanation</label>
              <p className="explanation-text">
                {algorithmText[algorithm]}
              </p>
            </div>
          </main>
        </div>
    </div>
  );
};

export default ExplanationContent;