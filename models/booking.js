import mongoose from "mongoose";

const bookingSchema = new mongoose.Schema({
    rommId:{
        type: "mongoose.Schema.Types.ObjectId",
        ref: "room",
        required: true,
    },

    userId:{
        type: "mongoose.Schema.Types.ObjectId",
        ref: "user",
        required: true,
    },

     date:{
        type: Date,
        required: true
    },

    startTime:{
        type: Date,
        required: true
    },

    endTime:{
        type: Date,
        required: true
    },

    status:{
        type: String,
        enum:["confirmed","cancelled","completed"],
        default: "confirmed"
    },

    resources:[
    {
        resourceId:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "resource"
    },
        quantity: {
        type: Number,
        default: 1
    }
    }]


})

    