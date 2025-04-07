import express from 'express';
import { signUp, signIn, editUser, removeUser, getUsers } from '../controllers/users.controller.js';
const router = express.Router()

router.get('/', getUsers);
router.post('/', signUp);
router.put('/', editUser);
router.delete('/', removeUser);
router.post('/login', signIn);

export default router
