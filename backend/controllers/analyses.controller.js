import lsbExtract from '../services/analyses.services/lsb.services.js';

async function lsbAnalyses (req, res) {
    try {
        const storagePath = req.file
            ? (req.file.destination ? `${req.file.destination}/${req.file.filename}` : req.file.path)
            : null;

        if (!storagePath) {
            return res.status(400).json({ message: 'No image file provided' });
        }

        const hiddenData = await lsbExtract(storagePath);

        return res.status(200).json({ hiddenData });

    } catch ( error ){
        console.error(error);
        return res.status(500).json({ message: 'Image extracting failed' });
    }
}

async function dctAnalyses (req, res) {
    return res.status(501).json({ message: 'DCT analysis not implemented' });
}

async function adaptiveAnalyses (req, res) {
    return res.status(501).json({ message: 'Adaptive analysis not implemented' });
}

export default {
    lsbAnalyses,
    dctAnalyses,
    adaptiveAnalyses
}