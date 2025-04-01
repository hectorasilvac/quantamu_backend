import express from 'express';
import { getScreener, getScreenerByFilters } from '../controllers/screener.controller.js';

const router = express.Router()

router.get('/', getScreener)
router.post('/', getScreenerByFilters)

export default router;
