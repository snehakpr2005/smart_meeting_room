import mongoose from 'mongoose';
import dotenv from 'dotenv';
import userModel from './models/user.js';
import roomModel from './models/room.js';
import resourceModel from './models/resource.js';
import bookingModel from './models/booking.js';
import waitingListModel from './models/waitingList.js';

dotenv.config();

const BASE_URL = 'http://localhost:3000';

async function runDatabaseVerification() {
  console.log('================================================================');
  console.log('STARTING DATABASE INTEGRATION & DATA PERSISTENCE VERIFICATION');
  console.log('================================================================\n');

  // Connect to MongoDB to verify directly in database
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB Atlas successfully.');

  const results = {};

  // 1. REGISTER A USER
  console.log('\n--- 1. Testing User Registration ---');
  const testUserEmail = `test.employee.${Date.now()}@company.com`;
  const testUserPassword = 'TestPassword@123';
  const testUserDept = 'IT';

  const regRes = await fetch(`${BASE_URL}/user/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      department: testUserDept,
      email: testUserEmail,
      password: testUserPassword
    })
  });
  const regJson = await regRes.json();
  console.log('HTTP Response Status:', regRes.status, 'User ID:', regJson._id);

  // Direct MongoDB verification
  const dbUser = await userModel.findOne({ email: testUserEmail });
  if (dbUser && dbUser.password !== testUserPassword && dbUser.password.startsWith('$2')) {
    console.log('MongoDB Verification: User successfully found in "users" collection!');
    console.log('  -> Email:', dbUser.email);
    console.log('  -> Department:', dbUser.department);
    console.log('  -> Role:', dbUser.role);
    console.log('  -> Password is securely hashed:', dbUser.password.substring(0, 15) + '...');
    results.userRegistration = true;
  } else {
    throw new Error('User was not properly saved or password not hashed in MongoDB!');
  }

  // 2. LOGGING IN WITH SAVED USER
  console.log('\n--- 2. Testing User Login ---');
  const loginRes = await fetch(`${BASE_URL}/user/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: testUserEmail,
      password: testUserPassword
    })
  });
  const loginJson = await loginRes.json();
  console.log('HTTP Response Status:', loginRes.status, 'Success:', loginJson.success);
  const employeeToken = loginJson.accessToken;
  if (employeeToken) {
    console.log('  -> Token successfully generated for DB user.');
    results.userLogin = true;
  } else {
    throw new Error('Login failed to return accessToken!');
  }

  // Also get Admin Token for admin operations
  const adminLoginRes = await fetch(`${BASE_URL}/user/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'admin.it@company.com',
      password: 'Admin@123'
    })
  });
  const adminLoginJson = await adminLoginRes.json();
  const adminToken = adminLoginJson.accessToken;

  // 3. CREATING AND UPDATING A ROOM
  console.log('\n--- 3. Testing Room Creation & Update ---');
  const testRoomName = `Test Conference Room ${Date.now()}`;
  const createRoomRes = await fetch(`${BASE_URL}/room/create`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminToken}`
    },
    body: JSON.stringify({
      name: testRoomName,
      capacity: 16,
      floor: 5
    })
  });
  const createRoomJson = await createRoomRes.json();
  const createdRoomId = createRoomJson.data?._id;
  console.log('Room Created via API. ID:', createdRoomId);

  // Verify in MongoDB
  let dbRoom = await roomModel.findById(createdRoomId);
  if (dbRoom && dbRoom.name === testRoomName && dbRoom.capacity === 16 && dbRoom.floor === 5) {
    console.log('MongoDB Verification: Room created in "rooms" collection!');
    console.log('  -> Stored Name:', dbRoom.name);
    console.log('  -> Stored Capacity:', dbRoom.capacity);
    console.log('  -> Stored Floor:', dbRoom.floor);
  } else {
    throw new Error('Room not found in MongoDB!');
  }

  // Update room
  const updateRoomRes = await fetch(`${BASE_URL}/room/room/${createdRoomId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminToken}`
    },
    body: JSON.stringify({
      capacity: 22,
      floor: 6
    })
  });
  await updateRoomRes.json();

  dbRoom = await roomModel.findById(createdRoomId);
  if (dbRoom && dbRoom.capacity === 22 && dbRoom.floor === 6) {
    console.log('MongoDB Verification: Room updated in "rooms" collection!');
    console.log('  -> Updated Capacity in DB:', dbRoom.capacity);
    console.log('  -> Updated Floor in DB:', dbRoom.floor);
    results.roomManagement = true;
  } else {
    throw new Error('Room update not reflected in MongoDB!');
  }

  // 4. CREATING AND UPDATING A RESOURCE
  console.log('\n--- 4. Testing Resource Creation & Update ---');
  const testUnitNum = Math.floor(Math.random() * 9000) + 1000;
  const createResRes = await fetch(`${BASE_URL}/resource/createResource`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminToken}`
    },
    body: JSON.stringify({
      name: 'Projector',
      unitNumber: testUnitNum,
      status: 'available'
    })
  });
  const createResJson = await createResRes.json();
  const createdResId = createResJson._id;
  console.log('Resource Created via API. ID:', createdResId);

  let dbResource = await resourceModel.findById(createdResId);
  if (dbResource && dbResource.unitNumber === testUnitNum && dbResource.status === 'available') {
    console.log('MongoDB Verification: Resource created in "resources" collection!');
    console.log('  -> Device Name:', dbResource.name);
    console.log('  -> Unit Number:', dbResource.unitNumber);
    console.log('  -> Status:', dbResource.status);
  } else {
    throw new Error('Resource not saved in MongoDB!');
  }

  // Update resource status to 'broken'
  const updateResRes = await fetch(`${BASE_URL}/resource/update/${createdResId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminToken}`
    },
    body: JSON.stringify({
      name: 'Projector',
      unitNumber: testUnitNum,
      status: 'broken'
    })
  });
  await updateResRes.json();

  dbResource = await resourceModel.findById(createdResId);
  if (dbResource && dbResource.status === 'broken') {
    console.log('MongoDB Verification: Resource status updated to "broken" in MongoDB!');
    // Set back to available so it can be booked
    dbResource.status = 'available';
    await dbResource.save();
    console.log('  -> Reset to "available" for booking test.');
    results.resourceManagement = true;
  } else {
    throw new Error('Resource status update failed in MongoDB!');
  }

  // 5. CREATING A ROOM BOOKING
  console.log('\n--- 5. Testing Room Booking Creation ---');
  const bookingDate = '2026-11-15';
  const createBookingRes = await fetch(`${BASE_URL}/booking/create`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${employeeToken}`
    },
    body: JSON.stringify({
      roomId: createdRoomId,
      date: bookingDate,
      startTime: '14:00',
      endTime: '15:30',
      attendees: 8,
      resources: [{ resourceId: createdResId, quantity: 1 }]
    })
  });
  const createBookingJson = await createBookingRes.json();
  const createdBookingId = createBookingJson.data?._id;
  console.log('Booking Created via API. ID:', createdBookingId);

  let dbBooking = await bookingModel.findById(createdBookingId);
  if (
    dbBooking &&
    dbBooking.status === 'confirmed' &&
    dbBooking.attendees === 8 &&
    dbBooking.startTime === '14:00' &&
    dbBooking.endTime === '15:30'
  ) {
    console.log('MongoDB Verification: Booking stored in "bookings" collection!');
    console.log('  -> Room ID in DB:', dbBooking.roomId);
    console.log('  -> User ID in DB:', dbBooking.userId);
    console.log('  -> Date in DB:', dbBooking.date.toISOString().split('T')[0]);
    console.log('  -> Time in DB:', `${dbBooking.startTime} - ${dbBooking.endTime}`);
    console.log('  -> Attendees in DB:', dbBooking.attendees);
    console.log('  -> Status in DB:', dbBooking.status);
    console.log('  -> Checked In:', dbBooking.checkedIn);
    console.log('  -> Resources assigned count:', dbBooking.resources.length);
    results.bookingCreation = true;
  } else {
    throw new Error('Booking record not found or attributes missing in MongoDB!');
  }

  // 6. CHECK-IN TO A BOOKING
  console.log('\n--- 6. Testing Booking Check-In ---');
  const checkInRes = await fetch(`${BASE_URL}/booking/checkedin/${createdBookingId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${employeeToken}`
    }
  });
  await checkInRes.json();

  dbBooking = await bookingModel.findById(createdBookingId);
  if (dbBooking && dbBooking.checkedIn === true) {
    console.log('MongoDB Verification: CheckedIn flag successfully updated to TRUE in MongoDB!');
    results.checkIn = true;
  } else {
    throw new Error('CheckIn flag was not updated to true in MongoDB!');
  }

  // 7. CANCELLING A BOOKING
  console.log('\n--- 7. Testing Booking Cancellation ---');
  const cancelRes = await fetch(`${BASE_URL}/booking/cancel/${createdBookingId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${employeeToken}`
    }
  });
  await cancelRes.json();

  dbBooking = await bookingModel.findById(createdBookingId);
  if (dbBooking && dbBooking.status === 'cancelled') {
    console.log('MongoDB Verification: Booking status updated to "cancelled" in MongoDB!');
    results.cancellation = true;
  } else {
    throw new Error('Booking status was not updated to cancelled in MongoDB!');
  }

  // 8. JOINING AND LEAVING A WAITING LIST
  console.log('\n--- 8. Testing Waiting List (Join & Leave) ---');
  const joinWaitRes = await fetch(`${BASE_URL}/waiting-list/join`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${employeeToken}`
    },
    body: JSON.stringify({
      roomId: createdRoomId,
      date: '2026-11-20',
      startTime: '10:00',
      endTime: '11:00',
      attendees: 5,
      notes: 'Important stakeholder review'
    })
  });
  const joinWaitJson = await joinWaitRes.json();
  const waitingId = joinWaitJson.data?._id;
  console.log('Waiting List Entry Created via API. ID:', waitingId);

  let dbWaiting = await waitingListModel.findById(waitingId);
  if (dbWaiting && dbWaiting.status === 'waiting' && dbWaiting.notes === 'Important stakeholder review') {
    console.log('MongoDB Verification: Waiting list request persisted in "waitinglists" collection!');
    console.log('  -> Room ID in DB:', dbWaiting.roomId);
    console.log('  -> User ID in DB:', dbWaiting.userId);
    console.log('  -> Status in DB:', dbWaiting.status);
    console.log('  -> Notes in DB:', dbWaiting.notes);
  } else {
    throw new Error('Waiting list request not found in MongoDB!');
  }

  // Leave waiting list
  const leaveWaitRes = await fetch(`${BASE_URL}/waiting-list/leave/${waitingId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${employeeToken}`
    }
  });
  await leaveWaitRes.json();

  dbWaiting = await waitingListModel.findById(waitingId);
  if (dbWaiting && dbWaiting.status === 'cancelled') {
    console.log('MongoDB Verification: Waiting list request marked "cancelled" in MongoDB!');
    results.waitingList = true;
  } else {
    throw new Error('Waiting list cancellation not updated in MongoDB!');
  }

  // 9. AUTOMATIC NO-SHOW CANCELLATION AND WAITING LIST AUTO-ASSIGNMENT
  console.log('\n--- 9. Testing Waiting List Auto-Assignment on Slot Freeing ---');
  // Create an active waiting list request for an employee
  const activeWaitRes = await fetch(`${BASE_URL}/waiting-list/join`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${employeeToken}`
    },
    body: JSON.stringify({
      roomId: createdRoomId,
      date: '2026-12-01',
      startTime: '13:00',
      endTime: '14:00',
      attendees: 4,
      notes: 'Waiting for slot'
    })
  });
  const activeWaitJson = await activeWaitRes.json();
  const waitEntryId = activeWaitJson.data?._id;

  // Create a booking for admin on the same slot
  const slotBookingRes = await fetch(`${BASE_URL}/booking/create`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminToken}`
    },
    body: JSON.stringify({
      roomId: createdRoomId,
      date: '2026-12-01',
      startTime: '13:00',
      endTime: '14:00',
      attendees: 4
    })
  });
  const slotBookingJson = await slotBookingRes.json();
  const slotBookingId = slotBookingJson.data?._id;
  console.log('Admin Booking created on slot. ID:', slotBookingId);

  // Admin cancels their booking -> should trigger auto-assignment to waiting list!
  console.log('Admin cancelling slot booking to test auto-assignment...');
  await fetch(`${BASE_URL}/booking/cancel/${slotBookingId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminToken}`
    }
  });

  // Verify that the waiting list document is updated to "assigned" and a new confirmed booking exists in MongoDB!
  dbWaiting = await waitingListModel.findById(waitEntryId);
  if (dbWaiting && dbWaiting.status === 'assigned' && dbWaiting.assignedBookingId) {
    const autoCreatedBooking = await bookingModel.findById(dbWaiting.assignedBookingId);
    if (autoCreatedBooking && autoCreatedBooking.status === 'confirmed') {
      console.log('MongoDB Verification: Slot Auto-Assignment fully verified in MongoDB!');
      console.log('  -> Waiting list entry updated to status: "assigned"');
      console.log('  -> Assigned Booking ID in MongoDB:', dbWaiting.assignedBookingId);
      console.log('  -> Auto-created Booking Status in MongoDB:', autoCreatedBooking.status);
      results.autoAssignment = true;
    } else {
      throw new Error('Auto-created booking not found in MongoDB!');
    }
  } else {
    throw new Error('Waiting list was not automatically assigned in MongoDB!');
  }

  // Clean up test room and test resources
  console.log('\nCleaning up test artifacts in MongoDB...');
  await roomModel.findByIdAndDelete(createdRoomId);
  await resourceModel.findByIdAndDelete(createdResId);
  await userModel.findByIdAndDelete(dbUser._id);
  console.log('Clean up complete.');

  console.log('\n================================================================');
  console.log('SUMMARY OF ACTUAL DATABASE COLLECTIONS & VERIFICATIONS');
  console.log('================================================================');
  console.log('1. User Registration & Password Hashing:      [PASSED] (Collection: "users")');
  console.log('2. User Authentication & JWT Claims:           [PASSED] (Collection: "users")');
  console.log('3. Room Management (Create, Read, Update):     [PASSED] (Collection: "rooms")');
  console.log('4. Resource Management (Create, Status Toggle):[PASSED] (Collection: "resources")');
  console.log('5. Room Booking & Attendees Persistence:       [PASSED] (Collection: "bookings")');
  console.log('6. Booking Check-In Persistence:               [PASSED] (Collection: "bookings")');
  console.log('7. Booking Cancellation Persistence:           [PASSED] (Collection: "bookings")');
  console.log('8. Waiting List Queue Persistence:             [PASSED] (Collection: "waitinglists")');
  console.log('9. Automatic Slot Assignment to Waiting List:  [PASSED] (Collection: "waitinglists" & "bookings")');
  console.log('================================================================');

  await mongoose.disconnect();
  console.log('Database verification successfully finished with 100% PASS.');
}

runDatabaseVerification().catch((err) => {
  console.error('\nDATABASE VERIFICATION FAILED:', err);
  process.exit(1);
});
