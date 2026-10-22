import mongoose from "mongoose";
import room from "../models/room.js";

export const createRoom = async (req, res) => {
    try {
        const { name, capacity, floor } = req.body;
        if (!name || !capacity || !floor) {
            return res.status(400).json({
                success: false,
                message: "all fields are required"
            });
        }

        const existingRoom = await room.findOne({ name });
        if (existingRoom) {
            return res.status(409).json({
                success: false,
                message: "room already exists"
            });
        }

        const rooms = await room.create({
            name,
            capacity,
            floor
        });

        return res.status(201).json({
            success: true,
            message: "room created successfully",
            data: rooms
        });

    } catch (err) {
        return res.status(500).json({
            success: false,
            message: err.message
        });
    }
};

export const getAllRooms = async (req, res) => {
    try {
        const rooms = await room.find();
        if (rooms.length === 0) {
            return res.status(404).json({
                success: false,
                message: "no rooms found"
            });
        }

        return res.status(200).json({
            success: true,
            count: rooms.length,
            message: "rooms fetched successfully",
            data: rooms
        });

    } catch (err) {
        res.status(500).json({
            success: false,
            message: err.message
        });
    }
};

export const getRoomById = async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid room id."
            });
        }

        const findRoom = await room.findById(id);
        if (!findRoom) {
            return res.status(404).json({
                success: false,
                message: "Room not found."
            });
        }

        return res.status(200).json({
            success: true,
            message: "Room fetched successfully.",
            data: findRoom
        });

    } catch (err) {
        return res.status(500).json({
            success: false,
            message: err.message
        });
    }
};

export const updateRoom = async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "id not found or invalid"
            });
        }

        const existingRoom = await room.findById(id);
        if (!existingRoom) {
            return res.status(404).json({
                success: false,
                message: "Room not found"
            });
        }

        const updatedRoom = await room.findByIdAndUpdate(id, req.body, { new: true });
        return res.status(200).json({
            success: true,
            message: "Room updated successfully.",
            data: updatedRoom
        });

    } catch (err) {
        return res.status(500).json({
            success: false,
            message: err.message
        });
    }
};
 
export const deleteRoom = async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "id not found or invalid"
            });
        }

        const findRoom = await room.findById(id);
        if (!findRoom) {
            return res.status(404).json({
                success: false,
                message: "room not found"
            });
        }

        const deletedRoom = await room.findByIdAndDelete(id);

        return res.status(200).json({
            success: true,
            message: "Room deleted successfully.",
            data: deletedRoom
        });

    } catch (err) {
        return res.status(500).json({
            success: false,
            message: err.message
        });
    }
};