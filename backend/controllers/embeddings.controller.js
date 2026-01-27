import images from '../models/images.js';
import embeddings from '../models/embeddings.js';
import embeddingsService from '../services/embeddings.services/lsb.services.js';

async function lsbEmbedding(req, res) {
    try {
        const { imageId } = req.body.image;
        const { hiddenData } = req.body.message;
        const image = await images.findById(imageId);
        if (!image) {
            return res.status(404).json({ message: 'Image not found' });
        }

        const embeddedImagePath = await embeddingsService.lsbEmbed(image.storagePath, hiddenData);

        await embeddings.create({
            imageId,
            method: 'LSB',
            embeddedImagePath,
            createdAt: new Date()
        })
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Image embedding failed' });
    }
}

export default {
    lsbEmbedding
}