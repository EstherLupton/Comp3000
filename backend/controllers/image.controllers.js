// import image from '../models/image.model.js';
import { validateImageCapacity } from '../services/validation.services/image.validation.services.js';

async function uploadImage(req, res) {
    try {
        if (req.file === null || req.file === undefined) {
            return res.status(400).json({ message: 'No image uploaded' });
        } else {
            const newImage = {
                origionalName: req.file.originalname,
                storagePath: req.file.path,
                size : req.file.size,
                uploadImagedAt: new Date()
            }
        }
        const createdImage = await image.create(newImage);
        return res.status(201).json({ message: 'Image uploaded successfully', imageId: createdImage._id });
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Image upload failed' });
    }
}
        
async function getImageById(req, res) {
    try {
        const imageId = req.params.id;
        const foundImage = await image.findById(imageId);
        if (!foundImage) {
            return res.status(404).json({ message: 'Image not found' });
        } else {
            return res.status(200).json({ image: foundImage });
        }
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Failed to retrieve image' });
    }
}  

async function deleteImageById(req, res) {
    try {
        const imageId = req.params.id;
        const deletedImage = await image.findByIdAndDelete(imageId);
        if (!deletedImage) {
            return res.status(404).json({ message: 'Image not found' });
        } else {
            return res.status(200).json({ message: 'Image deleted successfully' });
        }
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Failed to delete image' });
    }
}

async function imageCapacity(req, res) {
  try {
    const imagePath = req.file.path;
    const message = req.body?.message || "";

    const capacity = await validateImageCapacity(imagePath, message);

    return res.status(200).json({ capacity });

  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
}

export default {
    uploadImage,
    getImageById,
    deleteImageById,
    imageCapacity
}