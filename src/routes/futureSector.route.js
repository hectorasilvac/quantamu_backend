import express from 'express';
import { 
    getFutureSector, 
    addFutureSector, 
    editFutureSector, 
    removeFutureSector
} from '../controllers/futureSector.controller.js';

const router = express.Router()

router.get("/", getFutureSector);
router.post('/', addFutureSector);
router.put('/', editFutureSector);
router.delete('/', removeFutureSector);

export default router;
