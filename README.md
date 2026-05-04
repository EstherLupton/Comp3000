# HiddenPixels

HiddenPixels is an interactive, educational steganography toolkit that lets you hide secret messages inside images and then extract them.

Built as a BSc Computer Science (Cyber Security) final year project at the University of Plymouth.

---

## What is HiddenPixels?

HiddenPixels is a full-stack web application designed to bridge the gap between theoretical steganography concepts and hands-on learning. Unlike existing tools that simply perform steganography without explanation, HiddenPixels visualises the embedding process so users can see exactly what is happening to their image and why.

Users can embed and extract hidden text using three techniques, compare original and stegged images side-by-side, view a data map showing where bits have been hidden, and see an interactive explanation panel that breaks down each algorithm step by step.

---

## Features

- **Three steganography methods:**
  - Sequential LSB (Least Significant Bit)
  - Random LSB (key-based pixel scrambling via Fisher-Yates + SHA-256)
  - DCT (Discrete Cosine Transform, frequency-domain embedding)
- **Embed & extract** secret text messages into PNG, JPG, and BMP images
- **Side-by-side image comparison** of original vs stegged output
- **Data map visualisation** showing exactly where bits were hidden
- **Interactive explanation tab** with step-by-step algorithm breakdowns
- **Light and dark mode** UI
- **Responsive design** — works across different screen sizes
- **Runs entirely offline** after setup, no data leaves your machine
- **Image validation** to prevent malicious uploads (pixel flood attack protection, file type checks)

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, React Bootstrap, custom CSS (glass card design) |
| Backend | Node.js, Express 5, ES Modules |
| Image processing | Sharp |
| File uploads | Multer |
| Cryptography | crypto-js, seedrandom (PRNG for random LSB) |
| Database (future) | Mongoose / MongoDB |
| Dev tooling | concurrently (runs both servers with one command) |
| Testing | Jest, Supertest |
| Project management | Jira (Kanban), Git |

---

## System Requirements

| Requirement | Minimum | Recommended |
|---|---|---|
| RAM | 4 GB | 8 GB |
| OS | Windows™ | — |
| Browser | Any modern browser | — |
| Internet | Required for initial setup only | — |

The application runs entirely offline once installed. All API calls between the frontend and backend use the local loopback.

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/en) (with npm)
- Git

### Installation

```bash
# Clone the repository
git clone https://github.com/EstherLupton/Comp3000.git
cd Comp3000

# Install root dependencies
npm install

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend/frontend
npm install
```

### Running the Application

From the **root** of the repository, run both servers with a single command:

```bash
npm start
```

This uses `concurrently` to start both servers at once:

| Server | URL |
|---|---|
| Frontend (React) | http://localhost:3000 |
| Backend (Express) | http://localhost:5000 |
---

## How It Works

### Sequential LSB

Each pixel is stored as a sequence of bytes (one per colour channel). The method replaces the least significant bit of each byte with one bit of the secret message, working sequentially from byte 0. Alpha channels are skipped to avoid visible changes. This changes each colour value by 1 out of 255, so its imperceptible to the human eye.

### Random LSB

Uses the same bit-replacement logic as sequential LSB, but the order in which pixels are modified is scrambled using a secret key. The key is hashed with SHA-256 and used to seed an XORShift PRNG, which drives a Fisher-Yates shuffle of the pixel index. This scatters message bits across the whole image rather than leaving a detectable block in the top-left corner.

### DCT (Discrete Cosine Transform)

DCT operates in the frequency domain, the same domain used by JPEG compression. The image is split into 8×8 pixel blocks. Each block is transformed via 2D DCT, and the DC coefficient (representing average block brightness) is modified to carry a hidden bit using quantisation. The change is spread across the whole 8×8 region, making it more resistant to JPEG compression than LSB methods. Based on the Shield Algorithm.

---

## Supported File Types

| Format | Embed | Extract |
|---|---|---|
| PNG | ✅ | ✅ |
| JPG / JPEG | ✅ | ✅ |
| BMP | ✅ | ✅ |

> Note: PNG and BMP files uploaded for DCT embedding are converted to JPG internally, as DCT operates in the frequency domain used by JPEG compression.

---

## Security

HiddenPixels runs locally, so all processing happens on your machine. Each upload is validated before processing:

- Only JPG, JPEG, PNG, and BMP are accepted
- Sharp reads file metadata to confirm it is a real image
- Dimensions are capped at 10,000px and 60 MB to prevent pixel flood attacks
- Expected raw image size is calculated and checked against actual size

---

## Limitations

- Text-only embedding (file embedding not yet supported)
- Image steganography only (no audio or video support)
- DCT is single-threaded; large images will take longer to process
- Steganalysis and ML-based detection were not implemented in this version

---

## Future Work

- File-based embedding (hiding files, not just text)
- Steganalysis tools and format-conversion impact visualisation
- Machine learning classification of stegged vs non-stegged images
- Downloadable embedding/analysis reports
- Multi-user support with persistent storage
- More precise embedding capacity calculation (removing the current safety buffer)

---

## Ethical Use

HiddenPixels is built for **educational and authorised testing purposes only**. It should not be used to embed or extract data from images without the explicit permission of the owner. Use in accordance with the Computer Misuse Act 1990, UK GDPR, and relevant data protection legislation.

---

## Acknowledgements

Thanks to Nathan my project supervisor, Aless my course friend and best friend, and my parents for their support throughout this project.

---

## Author

**Esther Lupton**  
BSc (Hons) Computer Science (Cyber Security)
University of Plymouth  
COMP3000 Computing Project, 2025/2026