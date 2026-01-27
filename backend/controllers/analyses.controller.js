import images from '../models/images'
import analyses from '../models/analyses'
import lsbExtract from '../services/analyses.services/lsb.services.js'

async function lsbAnalyses (req, res) {
    try {
        const { imageId } = req.body.image;
        const image = await images.findById(imageId);
        if (!image) {
            return res.status(404).json({ message: 'Image not found' });
        }
        hiddenData = await lsbExtract.lsbExtract(image.storagePath)

        return (hiddenData)

    } catch ( error ){
        console.error(error);
        return res.status(500).json({ message: 'Image extracting failed' });
    }
}

async function dctAnalyses (req, res) {
    try {
        const { imageId } = req.body.image;
        const image = await images.findById(imageId);
        if (!image) {
            return res.status(404).json({ message: 'Image not found' });
        }

        hiddenData = await analysesService.dctExtract(image.storagePath)

        return (hiddenData)

    } catch ( error ){
        console.error(error);
        return res.status(500).json({ message: 'Image extracting failed' });
    }
}

async function adaptiveAnalyses (req, res) {
    try {
        const { imageId } = req.body.image;
        const image = await images.findById(imageId);
        if (!image) {
            return res.status(404).json({ message: 'Image not found' });
        }

        hiddenData = await analysesService.adaptiveExtract(image.storagePath)

        return (hiddenData)

    } catch ( error ){
        console.error(error);
        return res.status(500).json({ message: 'Image extracting failed' });
    }
}

export default {
    lsbAnalyses,
    dctAnalyses,
    adaptiveAnalyses
}