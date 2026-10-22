import mongoose from "mongoose";

const waitingListSchema = new mongoose.Schema({
    roomId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "room",
        required: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user",
        required: true
    },
    date: {
        type: Date,
        required: true
    },
    startTime: {
        type: String,
        required: true
    },
    endTime: {
        type: String,
        required: true
    },
    attendees: {
        type: Number,
        default: 1
    },
    status: {
        type: String,
        enum: ["waiting", "assigned", "cancelled"],
        default: "waiting"
    },
    assignedBookingId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "booking"
    },
    notes: {
        type: String
    }
}, { timestamps: true });

export default mongoose.model("waitingList", waitingListSchema);
