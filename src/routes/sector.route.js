import express from 'express';
import { 
    getSector, 
    addSector, 
    editSector, 
    removeSector, 
    getSectorCorrelations 
} from '../controllers/sector.controller.js';

const router = express.Router()

router.get("/", getSector);
router.post('/', addSector);
router.put('/', editSector);
router.delete('/', removeSector);
router.get('/correlations', getSectorCorrelations);

export default router;
