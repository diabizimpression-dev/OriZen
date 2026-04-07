import express from "express";
import { getStructures } from "../controllers/directory.controller.js";

const router = express.Router();

router.get("/", getStructures);

export default router;
