import mongoose from "mongoose";

const userSchema = new mongoose.Schema({

    department: {
        type: String,
        required: true,
        enum: ["IT", "Management", "Travel Agency"]
    },

    email: {
        type: String,
        required: true,
        unique: true
    },

    password: {
        type: String,
        required: true
    },

    refreshToken: {
        type: String,
    },

    role: {
        type: String,
        enum: ["employee", "admin", "facility_manager"],
    },

    bookings: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "booking"
        }
    ]

}, { timestamps: true });

export default mongoose.model("user", userSchema);