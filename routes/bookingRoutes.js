import express from "express";
import {
    createBooking,
    getAllBookings,
    getBookingById,
    cancelBooking,
    checkedInBooking

} from "../controllers/bookingController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/create", authMiddleware, createBooking);
router.get("/", authMiddleware, getAllBookings);
router.get("/:id", authMiddleware, getBookingById);
router.put("/cancel/:id", authMiddleware, cancelBooking);
router.put("/checkedin/:id", authMiddleware, checkedInBooking);

export default router;
