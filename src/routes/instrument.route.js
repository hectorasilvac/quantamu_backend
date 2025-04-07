import { Router } from "express";
import { getInstrument, addInstrument, editInstrument, removeInstrument } from "../controllers/instrument.controller.js";

const router = Router();

router.get("/", getInstrument);
router.post('/', addInstrument);
router.put('/', editInstrument);
router.delete('/', removeInstrument);
  
export default router;
