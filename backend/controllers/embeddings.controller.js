import lsbEmbed from '../services/embeddings.services.js/lsb.services.js';

async function lsbEmbedding(req, res) {
    try {
        const storagePath = req.file
            ? (req.file.destination ? `${req.file.destination}/${req.file.filename}` : req.file.path)
            : null;

        const hiddenData = typeof req.body?.message === 'string'
            ? req.body.message
            : req.body?.message?.hiddenData;

        if (!storagePath) {
            return res.status(400).json({ message: 'No image file provided' });
        }
        if (!hiddenData) {
            return res.status(400).json({ message: 'No message provided to embed' });
        }

        const embeddedImagePath = await lsbEmbed(storagePath, hiddenData);

        return res.status(200).json({ steggedPath: embeddedImagePath });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Image embedding failed' });
    }
}

async function dctEmbedding(req, res) {
    return res.status(501).json({ message: 'DCT embedding not implemented' });
}

async function adaptiveEmbedding(req, res) {
    return res.status(501).json({ message: 'Adaptive embedding not implemented' });
}

export default {
    lsbEmbedding,
    dctEmbedding,
    adaptiveEmbedding
}