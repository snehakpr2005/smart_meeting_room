import mongoose from "mongoose";
import resource from "../models/resource.js";


export const createResource = async (req, res) => {
    try {
        const { name, unitNumber, status } = req.body;
        if (!name || !unitNumber) {
            return res.status(400).json({
                message: "all fields are required"
            });
        }

        const newResource = await resource.create({
            name,
            unitNumber,
            status
        });

        res.status(201).json(newResource);
    }

    catch (error) {
        console.log(error);
        res.status(500).json({ message: error.message });
    }
}


export const getAllResources = async (req, res) => {
    try {
        const resources = await resource.find();
        res.status(200).json(resources);
    }

    catch (err) {
        res.status(500).json({ message: err.message });
    }
}


export const getResourceById = async (req, res) => {
    try {
        const { id } = req.params;
        if (!id) {
            return res.status(400).json({
                message: "id is required"
            });
        }

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                message: "invalid resource id format"
            });
        }

        const resourceData = await resource.findById(id);
        if (!resourceData) {
            return res.status(404).json({
                message: "resource not found"
            });
        }
        else {
            res.status(200).json(resourceData);
        }


    }
    catch (err) {
        res.status(500).json({ message: err.message });
    }

}


export const updateResource = async (req, res) => {
    try {

        const { id } = req.params;
        if (!id) {
            return res.status(400).json({
                message: "id is required"
            });
        }

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                message: "invalid resource id format"
            });
        }

        const check = await resource.findById(id);
        if (!check) {
            return res.status(404).json({
                message: "resource not found"
            });
        }


        const updatedresource = await resource.findByIdAndUpdate(id, req.body, { new: true, runValidators: true });
        if (!updatedresource) {
            return res.status(404).json({
                message: "resource not found"
            });
        }
        else {
            res.status(200).json(updatedresource);
        }
    }
    catch (err) {
        res.status(500).json({ message: err.message });
    }
}


export const deleteResource = async (req, res) => {
    try {
        const { id } = req.params;
        if (!id) {
            return res.status(400).json({
                message: "id is required"
            });
        }

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                message: "invalid resource id format"
            });
        }

        const check = await resource.findById(id);
        if (!check) {
            return res.status(404).json({
                message: "resource not found"
            });
        }


        await resource.findByIdAndDelete(id);
        return res.status(200).json({
            message: "resource deleted successfully"
        });

    }
    catch (err) {
        return res.status(500).json({
            message: err.message
        });

    }
}