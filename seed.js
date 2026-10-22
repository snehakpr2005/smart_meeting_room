import mongoose from "mongoose";

import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import user from "./models/user.js";

dotenv.config();

const seedUsers = [
    { department: "IT", email: "admin.it@company.com", password: "Admin@123", role: "admin" },
    

    { department: "Management", email: "admin.mgmt@company.com", password: "Admin@123", role: "admin" },
    

    { department: "Travel Agency", email: "admin.travel@company.com", password: "Admin@123", role: "admin" },
  
];

const seedDatabase = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log(" Connected to MongoDB");

        for (const eachUser of seedUsers) {
            const existingUser = await user.findOne({ email: eachUser.email });
            if (existingUser) {
                console.log(`Skipped (already exists): ${eachUser.email}`);
                continue;
            }

            const hashedPassword = await bcrypt.hash(eachUser.password, 10);

            const newUser = new user({
                department: eachUser.department,
                email: eachUser.email,
                password: hashedPassword,
                role: eachUser.role
            });

            await newUser.save();
            console.log(`Created: ${eachUser.email} (${eachUser.role})`);
        }

        console.log(" Seeding complete");
        process.exit(0);

    } catch (err) {
        console.error("Seeding error:", err.message);
        process.exit(1);
    }
};

seedDatabase();

