import mongoose from "mongoose";

const resourceSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },

    unitNumber: {
        type: Number,
        required: true,
        index: true
    },

    status: {
        type: String,
        enum: ["available", "broken"],
        default: "available"
    },

    bookings: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "booking"
        }
    ]

},
    { timestamps: true });

resourceSchema.index({ name: 1, unitNumber: 1 }, { unique: true });


export default mongoose.model("resource", resourceSchema);