import express from "express";
import embeddingsController from "../controllers/embeddings.controller.js";

const router = express.Router();

router.post("/", embeddingsController.lsbEmbedding);

export default router;