import mongoose from "mongoose";
import booking from "../models/booking.js";
import room from "../models/room.js";
import resource from "../models/resource.js";
import user from "../models/user.js";
import waitingList from "../models/waitingList.js";
import { assignWaitingListIfAvailable } from "./waitingListController.js";

export const createBooking = async (req, res) => {
    try {
        const { roomId, date, startTime, endTime, attendees, resources, title } = req.body;
        const bookedBy = req.user.userId;

        if (!roomId || !date || !startTime || !endTime) {
            return res.status(400).json({
                message: "all fields are required"
            });
        }

        if (!mongoose.Types.ObjectId.isValid(roomId)) {
            return res.status(400).json({
                message: "invalid room id"
            });
        }

        const existingRoom = await room.findById(roomId);
        if (!existingRoom) {
            return res.status(404).json({
                message: "room not found"
            });
        }

        if (startTime >= endTime) {
            return res.status(400).json({
                message: "startTime must be before endTime"
            });
        }

        if (attendees && attendees > existingRoom.capacity) {
            return res.status(400).json({
                message: "room capacity insufficient for attendees"
            });
        }

        const existingRoomBookings = await booking.find({
            roomId,
            date,
            status: "confirmed"
        });

        for (const existing of existingRoomBookings) {
            if (startTime < existing.endTime && endTime > existing.startTime) {
                return res.status(409).json({
                    message: "room is already booked for this time slot",
                    conflictSuggestWaitingList: true,
                    conflictDetails: { roomId, date, startTime, endTime, attendees }
                });
            }
        }

        const finalResources = [];

        if (resources && resources.length > 0) {
            for (const item of resources) {
                const { resourceId, quantity } = item;

                if (!resourceId) {
                    return res.status(400).json({
                        message: "each resource must have a resourceId"
                    });
                }

                const resourceDoc = await resource.findById(resourceId);
                if (!resourceDoc) {
                    return res.status(404).json({
                        message: "resource not found"
                    });
                }

                if (resourceDoc.status !== "available") {
                    return res.status(400).json({
                        message: `${resourceDoc.name} is broken and cannot be booked`
                    });
                }

                const existingResourceBookings = await booking.find({
                    date,
                    status: "confirmed",
                    "resources.resourceId": resourceId
                });

                for (const existing of existingResourceBookings) {
                    if (startTime < existing.endTime && endTime > existing.startTime) {
                        return res.status(409).json({
                            message: `${resourceDoc.name} is already booked for this time slot`
                        });
                    }
                }

                finalResources.push({
                    resourceId,
                    quantity: quantity || 1
                });
            }
        }

        const newBooking = await booking.create({
            roomId,
            userId: bookedBy,
            date,
            startTime,
            endTime,
            attendees: attendees ? Number(attendees) : 1,
            status: "confirmed",
            title: title || "Team Meeting",
            resources: finalResources
        });

        // 1. Update User document in database
        await user.findByIdAndUpdate(bookedBy, {
            $addToSet: { bookings: newBooking._id }
        });

        // 2. Update Room document in database
        await room.findByIdAndUpdate(roomId, {
            $addToSet: { bookings: newBooking._id }
        });

        // 3. Update Resource document(s) in database
        if (finalResources && finalResources.length > 0) {
            const resourceIds = finalResources.map(r => r.resourceId);
            await resource.updateMany(
                { _id: { $in: resourceIds } },
                { $addToSet: { bookings: newBooking._id } }
            );
        }

        // 4. Update WaitingList document in database if this user had an active waiting queue entry
        await waitingList.updateMany(
            {
                roomId,
                userId: bookedBy,
                date,
                status: "waiting",
                startTime: { $lt: endTime },
                endTime: { $gt: startTime }
            },
            {
                status: "assigned",
                assignedBookingId: newBooking._id
            }
        );

        return res.status(201).json({
            message: "booking created successfully",
            data: newBooking
        });

    } catch (err) {
        return res.status(500).json({
            message: err.message
        });
    }
};

export const getAllBookings = async (req, res) => {
    try {
        let filter = {};

        if (req.user.role !== "admin" && req.user.role !== "facility_manager") {
            filter.userId = req.user.userId;
        }

        const bookings = await booking.find(filter)
            .populate("roomId")
            .populate("resources.resourceId");

        return res.status(200).json({
            count: bookings.length,
            data: bookings
        });

    } catch (err) {
        return res.status(500).json({
            message: err.message
        });
    }
};

export const getBookingById = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                message: "invalid booking id"
            });
        }

        const foundBooking = await booking.findById(id)
            .populate("roomId")
            .populate("resources.resourceId");

        if (!foundBooking) {
            return res.status(404).json({
                message: "booking not found"
            });
        }

        if (
            req.user.role !== "admin" &&
            req.user.role !== "facility_manager" &&
            foundBooking.userId.toString() !== req.user.userId
        ) {
            return res.status(403).json({
                message: "access denied: you can only view your own bookings"
            });
        }

        return res.status(200).json({
            data: foundBooking
        });

    } catch (err) {
        return res.status(500).json({
            message: err.message
        });
    }
};

export const cancelBooking = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                message: "invalid booking id"
            });
        }

        const foundBooking = await booking.findById(id);
        if (!foundBooking) {
            return res.status(404).json({
                message: "booking not found"
            });
        }

        if (
            req.user.role !== "admin" &&
            req.user.role !== "facility_manager" &&
            foundBooking.userId.toString() !== req.user.userId
        ) {
            return res.status(403).json({
                message: "access denied: you can only cancel your own bookings"
            });
        }

        foundBooking.status = "cancelled";
        await foundBooking.save();

        // Check and assign waiting list candidates
        try {
            await assignWaitingListIfAvailable(
                foundBooking.roomId,
                foundBooking.date,
                foundBooking.startTime,
                foundBooking.endTime
            );
        } catch (assignErr) {
            console.error("Auto-assign error on cancellation:", assignErr.message);
        }

        return res.status(200).json({
            message: "booking cancelled successfully",
            data: foundBooking
        });

    } catch (err) {
        return res.status(500).json({
            message: err.message
        });
    }
}; 

export const checkedInBooking = async (req, res) => { 
    try { 
        const { id } = req.params; 
        if (!mongoose.Types.ObjectId.isValid(id)) { 
            return res.status(400).json({ message: "invalid booking id" }); 
        } 
        const foundBooking = await booking.findById(id); 
        if (!foundBooking) { 
            return res.status(404).json({ message: "booking not found" }); 
        } 
        if (req.user.role !== "admin" && req.user.role !== "facility_manager" && foundBooking.userId.toString() !== req.user.userId) { 
            return res.status(403).json({ message: "access denied" }); 
        } 
        foundBooking.checkedIn = true; 
        await foundBooking.save(); 
        return res.status(200).json({ success: true, message: "checked in successfully", data: foundBooking }); 
    } catch (error) { 
        return res.status(500).json({ success: false, message: error.message }); 
    } 
}; 
