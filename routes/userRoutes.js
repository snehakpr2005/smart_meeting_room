import express from 'express';
import { registerUser, loginUser, refreshAccessToken, logoutUser, registerfacilitymanager } from "../controllers/userController.js";
import { authMiddleware, authorizeRoles } from '../middleware/authMiddleware.js';


const router = express.Router();


router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/refreshToken', refreshAccessToken);
router.post('/logout', logoutUser);
router.post("/createfacilitymanager", authMiddleware, authorizeRoles("admin"), registerfacilitymanager);


export default router;