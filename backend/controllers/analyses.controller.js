import lsbExtract from '../services/analyses.services/lsb.services.js';
import { dctExtract } from '../services/analyses.services/dct.services.js';
import fs from 'fs';

async function lsbAnalyses (req, res) {
    try {
        const storagePath = req.body?.imagePath || req.file?.path;
        const allowedTypes = ["sequential", "random"];
        const mode = (req.body.lsbType || "sequential").toLowerCase();

        if (!storagePath) {
            return res.status(400).json({ message: 'No image file provided' });
        }

        if (!allowedTypes.includes(mode)) {
            return res.status(400).json({ message: 'Invalid LSB type' });
        }

        const lsbOptions = { mode, secretKey: mode === 'random' ? req.body?.secretKey : null };
        const hiddenData = await lsbExtract(storagePath, lsbOptions);

        return res.status(200).json({ hiddenData });

    } catch ( error ){
        console.error(error);
        return res.status(500).json({ message: 'Image extracting failed' });
    }
}

async function dctAnalyses (req, res) {
    try {
        const storagePath = req.file?.path;
        const dctOptions = req.body?.dctOptions


        if (!storagePath || !fs.existsSync(storagePath)) {
            return res.status(400).json({ message: 'No valid image file provided' });
        }

        if (!dctOptions) {
            return res.status(400).json({ message: 'No dct frequency provided' });
        }

        const hiddenData = await dctExtract(storagePath, dctOptions);
        
        return res.status(200).json({ hiddenData });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Image embedding failed" });
    }
}

async function adaptiveAnalyses (req, res) {
    return res.status(501).json({ message: 'Adaptive analysis not implemented' });
}

export default {
    lsbAnalyses,
    dctAnalyses,
    adaptiveAnalyses
}