import mongoose from "mongoose";

const roomSchema = new mongoose.Schema({

    name: {
        type: String,
        required: true
    },

    capacity: {
        type: Number,
        required: true
    },

    floor: {
        type: Number,
        required: true
    },

    bookings: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "booking"
        }
    ]

},
    { timestamps: true });

export default mongoose.model("room", roomSchema);