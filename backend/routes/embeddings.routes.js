import express from "express";
import embeddingsController from "../controllers/embeddings.controller.js";

const router = express.Router();

router.post("/lsb", embeddingsController.lsbEmbedding);
router.post("/dct", embeddingsController.dctEmbedding);
router.post("/adaptive", embeddingsController.adaptiveEmbedding);

module.exports = router;