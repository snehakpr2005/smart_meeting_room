import mongoose from "mongoose";

const bookingSchema = new mongoose.Schema({
    roomId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "room",
        required: true,
    },

    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user",
        required: true,
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

    status: {
        type: String,
        enum: ["confirmed", "cancelled", "completed"],
        default: "confirmed"
    },

    checkedIn:{
        type:Boolean,
        default:false
    },
    

    resources: [
        {
            resourceId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "resource"
            },
            quantity: {
                type: Number,
                default: 1
            }
        }]


}, { timestamps: true });

export default mongoose.model("booking", bookingSchema);

