import nodeCron from "node-cron";
import booking from "../models/booking.js";
import { assignWaitingListIfAvailable } from "../controllers/waitingListController.js";

nodeCron.schedule("* * * * *", async () => {
    console.log("Running booking scheduler...")

    const now = new Date();

    const confirmedBookings = await booking.find({ status: "confirmed" });

    for (const b of confirmedBookings) {
        const bookingDateStr = b.date.toISOString().split("T")[0];
        const bookingEndDateTime = new Date(`${bookingDateStr}T${b.endTime}:00`);

        if (bookingEndDateTime < now) {
            b.status = "completed";
            await b.save();
            console.log(`Booking ${b._id} marked as completed`);
        }
    }


    const notCheckedIn = await booking.find({ status: "confirmed", checkedIn: false });

    for (const b of notCheckedIn) {
        const bookingDateStr = b.date.toISOString().split("T")[0];
        const bookingStartDateTime = new Date(`${bookingDateStr}T${b.startTime}:00`);
        const deadline = new Date(bookingStartDateTime.getTime() + 15 * 60000);

        if (now > deadline) {
            b.status = "cancelled";
            await b.save();
            console.log(`Booking ${b._id} auto-cancelled - no check-in`);

            try {
                await assignWaitingListIfAvailable(b.roomId, b.date, b.startTime, b.endTime);
            } catch (err) {
                console.error("Scheduler auto-assignment error:", err.message);
            }
        }
    }
});




