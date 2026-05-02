import express from "express";
import { createPlan, getPlanById } from "../controllers/plans.controller.js";

const router = express.Router();

router.post("/", createPlan);
router.get("/:id", getPlanById);

export default router;
