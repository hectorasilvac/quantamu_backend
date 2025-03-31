import express from 'express';
import { validate } from '../middlewares/validate.middleware.js'
import { updateSchema, groupedSchema, aggregatedSchema, stratBySymbolSchema, getSymbolsSchema } from '../validations/data.schema.js';
import { 
  updateData, 
  getOhlcGroupedData, 
  getAggregatedData, 
  getSectorsData, 
  getStratSectors, 
  getStratBySector, 
  getStratBySymbol, 
  getSymbols, 
  getSectorsPerformance, 
  getTopGainers, 
  getTopLosers, 
  getTopVolume, 
  addNewInstruments,
  updateInstruments,
  deleteInstrument,
  getSectorStockRelations,
  addSectorStockRelations
} from '../controllers/data.controller.js';

const router = express.Router();

router.get('/aggregated', validate(aggregatedSchema, 'query'), getAggregatedData);
router.get('/gainers', getTopGainers);
router.get('/losers', getTopLosers);
router.get('/grouped', validate(groupedSchema, 'query'), getOhlcGroupedData);
// TODO: Agregar schema para validar datos de instruments/add y instruments/update y delete

router.post('/instruments/add', addNewInstruments);
router.put('/instruments/update', updateInstruments);
router.delete('/instruments/delete/:id', deleteInstrument);

router.get('/sectors', getSectorsData);
router.get('/sectors/performance', getSectorsPerformance);
router.get('/sectors/stocks', getSectorStockRelations);
router.post('/sectors/stocks/add', addSectorStockRelations);

router.get('/strat', validate(stratBySymbolSchema, 'query'), getStratBySymbol);
router.get('/strat/sectors', getStratSectors);
router.get('/strat/sector', validate(stratBySymbolSchema, 'query'), getStratBySector);

router.get('/symbols', validate(getSymbolsSchema, 'query'), getSymbols);
router.get('/update', validate(updateSchema, 'query'), updateData);
router.get('/volume', getTopVolume);

export default router