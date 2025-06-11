import { Router } from 'express';
import { register, login, logout } from './auth.controller';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout); // Or GET, depending on preference

export default router;
