import express from 'express';
import { getScreener } from '../controllers/screener.controller.js';

const router = express.Router()

router.get('/', getScreener)

export default router;
