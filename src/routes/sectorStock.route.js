import express from 'express';
import { 
    getSectorStock, 
    addSectorStock, 
    editSectorStock, 
    removeSectorStock
} from '../controllers/sectorStock.controller.js';

const router = express.Router()

router.get("/", getSectorStock);
router.post('/', addSectorStock);
router.put('/', editSectorStock);
router.delete('/', removeSectorStock);

export default router;
