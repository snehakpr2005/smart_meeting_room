import mongoose from "mongoose";
import waitingList from "../models/waitingList.js";
import room from "../models/room.js";
import booking from "../models/booking.js";
import user from "../models/user.js";

export const joinWaitingList = async (req, res) => {
    try {
        const { roomId, date, startTime, endTime, attendees, notes } = req.body;
        const userId = req.user.userId;

        if (!roomId || !date || !startTime || !endTime) {
            return res.status(400).json({
                success: false,
                message: "roomId, date, startTime, and endTime are required"
            });
        }

        if (!mongoose.Types.ObjectId.isValid(roomId)) {
            return res.status(400).json({
                success: false,
                message: "invalid room id"
            });
        }

        const roomDoc = await room.findById(roomId);
        if (!roomDoc) {
            return res.status(404).json({
                success: false,
                message: "room not found"
            });
        }

        if (startTime >= endTime) {
            return res.status(400).json({
                success: false,
                message: "startTime must be before endTime"
            });
        }

        // Check if user is already waiting for an overlapping slot in this room
        const existingWaiting = await waitingList.findOne({
            roomId,
            userId,
            date,
            status: "waiting",
            startTime: { $lt: endTime },
            endTime: { $gt: startTime }
        });

        if (existingWaiting) {
            return res.status(409).json({
                success: false,
                message: "You are already in the waiting list for this room and time slot"
            });
        }

        const entry = await waitingList.create({
            roomId,
            userId,
            date,
            startTime,
            endTime,
            attendees: attendees ? Number(attendees) : 1,
            notes: notes || "",
            status: "waiting"
        });

        const populated = await waitingList.findById(entry._id)
            .populate("roomId", "name capacity floor")
            .populate("userId", "email department");

        return res.status(201).json({
            success: true,
            message: "Successfully joined waiting list in database",
            data: populated
        });

    } catch (err) {
        return res.status(500).json({
            success: false,
            message: err.message
        });
    }
};

export const getWaitingList = async (req, res) => {
    try {
        const filter = {};
        if (req.user.role !== "admin" && req.user.role !== "facility_manager") {
            filter.userId = req.user.userId;
        }

        const entries = await waitingList.find(filter)
            .sort({ createdAt: -1 })
            .populate("roomId", "name capacity floor")
            .populate("userId", "email department")
            .populate("assignedBookingId");

        return res.status(200).json({
            success: true,
            count: entries.length,
            data: entries
        });

    } catch (err) {
        return res.status(500).json({
            success: false,
            message: err.message
        });
    }
};

export const leaveWaitingList = async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "invalid waiting list id"
            });
        }

        const entry = await waitingList.findById(id);
        if (!entry) {
            return res.status(404).json({
                success: false,
                message: "waiting list entry not found"
            });
        }

        if (
            req.user.role !== "admin" &&
            req.user.role !== "facility_manager" &&
            entry.userId.toString() !== req.user.userId
        ) {
            return res.status(403).json({
                success: false,
                message: "access denied"
            });
        }

        entry.status = "cancelled";
        await entry.save();

        return res.status(200).json({
            success: true,
            message: "Successfully removed from waiting list queue in database",
            data: entry
        });

    } catch (err) {
        return res.status(500).json({
            success: false,
            message: err.message
        });
    }
};

// Automatic assignment helper: invoked when a room slot is freed (manual cancellation or 15m no-show cron)
export const assignWaitingListIfAvailable = async (roomId, date, startTime, endTime) => {
    try {
        const waitingCandidate = await waitingList.findOne({
            roomId,
            date,
            status: "waiting",
            startTime: { $lt: endTime },
            endTime: { $gt: startTime }
        }).sort({ createdAt: 1 }); // FIFO priority

        if (!waitingCandidate) return null;

        // Create confirmed booking in MongoDB for the candidate
        const newBooking = await booking.create({
            roomId,
            userId: waitingCandidate.userId,
            date,
            startTime: waitingCandidate.startTime,
            endTime: waitingCandidate.endTime,
            attendees: waitingCandidate.attendees || 1,
            status: "confirmed",
            resources: []
        });

        // Update User & Room documents in MongoDB
        await user.findByIdAndUpdate(waitingCandidate.userId, {
            $addToSet: { bookings: newBooking._id }
        });
        await room.findByIdAndUpdate(roomId, {
            $addToSet: { bookings: newBooking._id }
        });

        // Update waiting list document in MongoDB
        waitingCandidate.status = "assigned";
        waitingCandidate.assignedBookingId = newBooking._id;
        await waitingCandidate.save();

        console.log(`[Auto-Assignment] Waiting list request ${waitingCandidate._id} automatically assigned to booking ${newBooking._id}`);
        return newBooking;

    } catch (err) {
        console.error("Error in assignWaitingListIfAvailable:", err.message);
        return null;
    }
};
