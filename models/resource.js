import mongoose from "mongoose";    

const resourceSchema = new mongoose.Schema({
    name:{
        type: String,
        required: true              
    },

    quantity:{
        type: Number,
        required: true
    },

    status:{ 
        type: String,
        enum:["available", "broken"],
        default: "available"
    },

    timestamps: true


});

export default mongoose.model("resource", resourceSchema);