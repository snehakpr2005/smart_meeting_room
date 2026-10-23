import express from "express";
import { createRoom, getAllRooms, getRoomById, updateRoom, deleteRoom } from "../controllers/roomController.js";
import { getSuggestions, getRoomAvailability } from "../controllers/suggestionController.js";
import { authMiddleware,authorizeRoles } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/create",authMiddleware,authorizeRoles("admin"), createRoom);
router.get("/rooms",authMiddleware, getAllRooms);
router.get("/room/:id",authMiddleware, getRoomById);
router.put("/room/:id",authMiddleware,authorizeRoles("admin"), updateRoom);
router.delete("/room/:id",authMiddleware,authorizeRoles("admin"), deleteRoom);
router.get("/suggestions", authMiddleware, getSuggestions);
router.get("/availability", authMiddleware, getRoomAvailability);

export default router;