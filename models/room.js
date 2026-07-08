import mongoose from "mongoose";

const roomSchema = new mongoose.Schema({

    name:{
        type: String,
        required: true
    },

    capacity:{
        type: Number,
        required: true
    },
    
    floor:{
        type: Number,
        required: true
    },

    resources:{
        type: [String],
        required: true
    },

    timestamps: true


});

export default mongoose.model("room", roomSchema);