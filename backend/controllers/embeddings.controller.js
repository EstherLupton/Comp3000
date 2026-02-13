import { lsbEmbed } from '../services/embeddings.services/lsb.services.js';

async function lsbEmbedding(req, res) {
    try {
        const storagePath = req.body?.imagePath || req.file?.path;
        const hiddenData = req.body?.message;

        if (!storagePath) {
            return res.status(400).json({ message: 'No image file provided' });
        }
        if (!hiddenData) {
            return res.status(400).json({ message: 'No message provided to embed' });
        }

        const allowedTypes = ["sequential", "random"];
        const mode = (req.body.lsbType || "sequential").toLowerCase();

        if (!allowedTypes.includes(mode)) {
            return res.status(400).json({ message: "Invalid LSB type" });
        }

        const secretKey = mode === 'random' ? req.body?.secretKey : null;

        if (mode === "random" && !secretKey) {
            return res.status(400).json({ message: "Secret key required for random LSB" });
        }

        const lsbOptions = { mode, secretKey: secretKey || null };
        const embeddedImagePath = await lsbEmbed(storagePath, hiddenData, lsbOptions);


        const normalizedPath = embeddedImagePath.replace(/\\/g, "/");

        return res.status(200).json({
            steggedUrl: `http://localhost:5000/${normalizedPath}`
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Image embedding failed" });
    }
}

async function dctEmbedding(req, res) {
    return res.status(501).json({ message: "DCT embedding not implemented" });
}

async function adaptiveEmbedding(req, res) {
    return res.status(501).json({ message: "Adaptive embedding not implemented" });
}

export default {
    lsbEmbedding,
    dctEmbedding,
    adaptiveEmbedding
}