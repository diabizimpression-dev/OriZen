import express from "express";
import { getStats } from "../controllers/dashboard.controller.js";

const router = express.Router();

router.get("/", getStats);

export default router;
