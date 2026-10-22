import express from "express";
import dotenv from "dotenv";
import connectDB from "./config/db.js"; 
import userRoutes from "./routes/userRoutes.js";
import roomRoutes from "./routes/roomRoutes.js"
import resourceRoutes from "./routes/resourceRoutes.js";
import bookingRoutes from "./routes/bookingRoutes.js";
import cookieParser from "cookie-parser";
import "./scheduler/cron.js";


dotenv.config();

connectDB();

const app = express();

app.use(express.json());
app.use(cookieParser())
app.use("/user/auth",userRoutes);
app.use("/resource",resourceRoutes);
app.use("/room",roomRoutes);
app.use("/booking",bookingRoutes);


const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});