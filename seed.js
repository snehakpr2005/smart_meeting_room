import mongoose from "mongoose";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import user from "./models/user.js";
import room from "./models/room.js";
import resource from "./models/resource.js";

dotenv.config();

const seedUsers = [
    { department: "IT", email: "admin.it@company.com", password: "Admin@123", role: "admin" },
    { department: "Management", email: "admin.mgmt@company.com", password: "Admin@123", role: "admin" },
    { department: "Travel Agency", email: "admin.travel@company.com", password: "Admin@123", role: "admin" },
    { department: "IT", email: "employee@company.com", password: "User@123", role: "employee" },
    { department: "Management", email: "facility@company.com", password: "Facility@123", role: "facility_manager" }
];

const seedRooms = [
    { name: "Boardroom Alpha", capacity: 20, floor: 3 },
    { name: "Innovation Hub", capacity: 14, floor: 2 },
    { name: "Focus Pod 1", capacity: 4, floor: 1 },
    { name: "Executive Suite", capacity: 10, floor: 4 },
    { name: "Conference Room Blue", capacity: 8, floor: 1 }
];

const seedResources = [
    { name: "Projector", unitNumber: 1, status: "available" },
    { name: "Projector", unitNumber: 2, status: "available" },
    { name: "TV", unitNumber: 1, status: "available" },
    { name: "TV", unitNumber: 2, status: "available" },
    { name: "Speaker", unitNumber: 1, status: "available" },
    { name: "Speaker", unitNumber: 2, status: "available" },
    { name: "Video Camera", unitNumber: 1, status: "available" },
    { name: "Conference Phone", unitNumber: 1, status: "available" },
    { name: "Conference Phone", unitNumber: 2, status: "broken" }
];

const seedDatabase = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to MongoDB");

        // Seed users
        for (const eachUser of seedUsers) {
            const existingUser = await user.findOne({ email: eachUser.email });
            if (existingUser) {
                console.log(`Skipped user (already exists): ${eachUser.email}`);
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
            console.log(`Created user: ${eachUser.email} (${eachUser.role})`);
        }

        // Seed rooms
        for (const r of seedRooms) {
            const existingRoom = await room.findOne({ name: r.name });
            if (existingRoom) {
                console.log(`Skipped room (already exists): ${r.name}`);
                continue;
            }
            const newRoom = new room(r);
            await newRoom.save();
            console.log(`Created room: ${r.name} (Cap: ${r.capacity}, Floor: ${r.floor})`);
        }

        // Seed resources
        for (const res of seedResources) {
            const existingRes = await resource.findOne({ name: res.name, unitNumber: res.unitNumber });
            if (existingRes) {
                console.log(`Skipped resource (already exists): ${res.name} #${res.unitNumber}`);
                continue;
            }
            const newRes = new resource(res);
            await newRes.save();
            console.log(`Created resource: ${res.name} #${res.unitNumber} (${res.status})`);
        }

        console.log("Seeding complete successfully!");
        process.exit(0);

    } catch (err) {
        console.error("Seeding error:", err.message);
        process.exit(1);
    }
};

seedDatabase();
