import mongoose from "mongoose";

const userSchema = new mongoose.Schema({

    department:{
        type:String,
        required:true
    },

    email:{
        type:String,
        required:true,
        unique: true 
    },

    role:{
        type:String,
        enum:["employee", "admin", "facility manager"],
    },

    timestamps: true

});

export default mongoose.model("user", userSchema);