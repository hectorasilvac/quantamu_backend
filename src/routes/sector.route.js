import express from 'express';
import { getMarketSectors } from '../controllers/sector.controller.js';

const router = express.Router()

router.get('/', getMarketSectors)

export default router;
