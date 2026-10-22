import express from "express";
import {
    joinWaitingList,
    getWaitingList,
    leaveWaitingList
} from "../controllers/waitingListController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/join", authMiddleware, joinWaitingList);
router.get("/", authMiddleware, getWaitingList);
router.put("/leave/:id", authMiddleware, leaveWaitingList);
router.delete("/:id", authMiddleware, leaveWaitingList);

export default router;
