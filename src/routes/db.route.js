import express from 'express';
import { validate } from '../middlewares/validate.middleware.js'
import { addCategorySchema, addInstrumentSchema, editCategorySchema, getInstrumentsSchema } from '../validations/db.schema.js';
import { addCategory, addInstrument, addSectorStock, editCategory, getInstruments, getCategories } from '../controllers/db.controller.js'; // Corrige la extensión del archivo

const router = express.Router()

router.post('/category', validate(addCategorySchema, 'query'), addCategory);
router.put('/category', validate(editCategorySchema, 'query'), editCategory);
router.get('/category', getCategories);

router.post('/instrument', validate(addInstrumentSchema), addInstrument);
router.get('/instrument', validate(getInstrumentsSchema, 'query'), getInstruments);

router.post('/sector/stock', addSectorStock);

export default router
