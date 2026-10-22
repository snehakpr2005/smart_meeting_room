import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import connectDB from "./config/db.js"; 
import userRoutes from "./routes/userRoutes.js";
import roomRoutes from "./routes/roomRoutes.js"
import resourceRoutes from "./routes/resourceRoutes.js";
import bookingRoutes from "./routes/bookingRoutes.js";
import waitingListRoutes from "./routes/waitingListRoutes.js";
import cookieParser from "cookie-parser";
import "./scheduler/cron.js";


dotenv.config();

const app = express();

const allowedOrigins = (process.env.CLIENT_ORIGIN || "http://localhost:5173")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error("Origin is not allowed by CORS"));
  },
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());
app.use("/user/auth",userRoutes);
app.use("/resource",resourceRoutes);
app.use("/room",roomRoutes);
app.use("/booking",bookingRoutes);
app.use("/waiting-list",waitingListRoutes);


const PORT = process.env.PORT || 5000;

await connectDB();

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});