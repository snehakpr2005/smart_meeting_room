import booking from "../models/booking.js";
import room from "../models/room.js";

/**
 * GET /room/suggestions?roomId=...&date=...&startTime=...&endTime=...&attendees=...
 * Returns:
 *   - alternativeRooms: other rooms free for the requested slot
 *   - alternativeSlots: free time windows on the same room on the same day
 *   - nearbyDates: adjacent days where the same room is free for a similar duration
 */
export const getSuggestions = async (req, res) => {
    try {
        const { roomId, date, startTime, endTime, attendees } = req.query;
        if (!date || !startTime || !endTime) {
            return res.status(400).json({ success: false, message: "date, startTime, endTime are required" });
        }

        const neededCapacity = Number(attendees) || 1;
        const slotDuration = timeToMinutes(endTime) - timeToMinutes(startTime);

        // ── 1. Alternative rooms (same day, same slot, enough capacity) ──────────
        const allRooms = await room.find({ capacity: { $gte: neededCapacity } });
        const conflictingRoomIds = new Set();

        const dayBookings = await booking.find({ date, status: "confirmed" });
        for (const b of dayBookings) {
            if (b.startTime < endTime && b.endTime > startTime) {
                conflictingRoomIds.add(b.roomId.toString());
            }
        }

        const alternativeRooms = allRooms
            .filter(r => r._id.toString() !== roomId && !conflictingRoomIds.has(r._id.toString()))
            .slice(0, 5)
            .map(r => ({
                _id: r._id,
                name: r.name,
                capacity: r.capacity,
                floor: r.floor,
                reason: `Same time slot, capacity ${r.capacity}`
            }));

        // ── 2. Alternative time slots on same room same day ───────────────────────
        let alternativeSlots = [];
        if (roomId) {
            const roomBookings = dayBookings
                .filter(b => b.roomId.toString() === roomId)
                .sort((a, b) => a.startTime.localeCompare(b.startTime));

            const busySlots = roomBookings.map(b => ({ start: b.startTime, end: b.endTime }));
            alternativeSlots = findFreeSlots(busySlots, slotDuration).slice(0, 4);
        }

        // ── 3. Nearby dates (±3 days) where same room + slot is free ─────────────
        let nearbyDates = [];
        if (roomId) {
            const baseDate = new Date(date);
            for (let offset = -3; offset <= 3; offset++) {
                if (offset === 0) continue;
                const candidate = new Date(baseDate);
                candidate.setDate(candidate.getDate() + offset);
                const candidateStr = candidate.toISOString().split('T')[0];
                if (candidateStr < new Date().toISOString().split('T')[0]) continue;

                const conflict = await booking.findOne({
                    roomId,
                    date: candidateStr,
                    status: "confirmed",
                    startTime: { $lt: endTime },
                    endTime: { $gt: startTime }
                });
                if (!conflict) {
                    nearbyDates.push({ date: candidateStr, label: formatDateLabel(candidate) });
                }
                if (nearbyDates.length >= 3) break;
            }
        }

        return res.status(200).json({
            success: true,
            data: { alternativeRooms, alternativeSlots, nearbyDates }
        });

    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

/**
 * GET /room/availability?roomId=...&date=...
 * Returns all booked time slots for a room on a given date (for calendar view)
 */
export const getRoomAvailability = async (req, res) => {
    try {
        const { roomId, date } = req.query;
        if (!roomId || !date) {
            return res.status(400).json({ success: false, message: "roomId and date are required" });
        }

        const bookings = await booking.find({
            roomId,
            date,
            status: "confirmed"
        }).select("startTime endTime attendees checkedIn userId").populate("userId", "email department");

        return res.status(200).json({
            success: true,
            data: bookings
        });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function timeToMinutes(t) {
    const [h, m] = t.split(':').map(Number);
    return h * 60 + m;
}

function minutesToTime(mins) {
    const h = Math.floor(mins / 60).toString().padStart(2, '0');
    const m = (mins % 60).toString().padStart(2, '0');
    return `${h}:${m}`;
}

function findFreeSlots(busySlots, durationMins) {
    const workStart = timeToMinutes('08:00');
    const workEnd = timeToMinutes('20:00');
    const slots = [];
    let cursor = workStart;

    for (const busy of busySlots) {
        const busyStart = timeToMinutes(busy.start);
        const busyEnd = timeToMinutes(busy.end);
        if (cursor + durationMins <= busyStart) {
            slots.push({ startTime: minutesToTime(cursor), endTime: minutesToTime(cursor + durationMins) });
            cursor = busyStart;
        }
        if (busyEnd > cursor) cursor = busyEnd;
    }

    if (cursor + durationMins <= workEnd) {
        slots.push({ startTime: minutesToTime(cursor), endTime: minutesToTime(cursor + durationMins) });
    }

    return slots;
}

function formatDateLabel(date) {
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}
