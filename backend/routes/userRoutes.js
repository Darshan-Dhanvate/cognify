import express from 'express';
import { registerUser } from '../controllers/userController.js';
import { authUser } from '../controllers/authController.js'

const router = express.Router();
// router.post('/', registerUser);
router.post('/register', registerUser);
router.post('/login', authUser);
export default router;