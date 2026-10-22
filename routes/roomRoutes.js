import express from "express";
import { createRoom, getAllRooms, getRoomById, updateRoom, deleteRoom } from "../controllers/roomController.js";
import { authMiddleware,authorizeRoles } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/create",authMiddleware,authorizeRoles("admin"), createRoom);
router.get("/rooms",authMiddleware, getAllRooms);
router.get("/room/:id",authMiddleware, getRoomById);
router.put("/room/:id",authMiddleware,authorizeRoles("admin"), updateRoom);
router.delete("/room/:id",authMiddleware,authorizeRoles("admin"), deleteRoom);


export default router;