import { formatOhlcFromApi, insertOhlcBatch, fetchGroupedOhlcData, fetchAggregatedData, fetchSectorsData, fetchStratSectors, fetchStratBySector, fetchStratBySymbol, fetchSymbols, fetchSectorsPerformance, fetchStratGainers, fetchStratLosers, fetchStratVolume, insertNewInstruments, editInstruments, removeInstrument, fetchSectorStockRelations } from '../services/data.service.js'


export const getOhlcGroupedData = async (req, res) => {
  try {
    let { symbols } = req.query;

    if (symbols && typeof symbols === 'string') {
      symbols = symbols.split(',').map(s => s.trim());
    }
    
    const result = await fetchGroupedOhlcData({ symbols });
    res.status(200).json({
      success: true,
      data: result,
      message: 'Grouped OHLC: Data retrieved successfully.'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      data: null,
      message: `Groped OHLC: Error retrieving data ${error.message}`
    });
  }
};

export const getAggregatedData = async (req, res) => {
  try {
    let { symbols } = req.query;

    if (symbols && typeof symbols === 'string') {
      symbols = symbols.split(',').map(s => s.trim().toUpperCase());
    }
    
    const result = await fetchAggregatedData({ symbols });
    res.status(200).json({
      success: true,
      data: result,
      message: 'Aggregated: Data retrieved successfully.'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      data: null,
      message: `Aggregated: Error retrieving data ${error.message}`
    });
  }
};

export const updateData = async (req, res) => {
  const { date } = req.query;
  
    try {
    const data = await formatOhlcFromApi({ customDate: date });
    const result = await insertOhlcBatch({ ohlcData: data });

    res.status(200).json({
      success: true,
      data: result,
      message: 'OHLC Data: Data updated successfully.'
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      data: null,
      message: `OHLC Data: Error updating data (${error})`
    })
  }
};

export const getSectorsData = async (req, res) => {
  try {
    const result = await fetchSectorsData();
    res.status(200).json({
      success: true,
      data: result,
      message: 'Futures & Sectors: data retrieved successfully.'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      data: null,
      message: `Futures & Sectors: Error retrieving data: ${error.message}`
    });
  }
};

export const getStratSectors = async (req, res) => {
  try {
    const result = await fetchStratSectors();
    res.status(200).json({
      success: true,
      data: result,
      message: 'Sectors (Strat): data retrieved successfully.'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      data: null,
      message: `Sectors (Strat): Error retrieving data: ${error.message}`
    });
  }
};

export const getStratBySector = async (req, res) => {
  const { symbol } = req.query;

  try {
    let result;
    const stratBySector = await fetchStratBySector({ symbol: symbol.toUpperCase() });

    if (stratBySector.length === 0) {
      result = await fetchStratBySymbol({ symbol: symbol.toUpperCase() })
    } else {
      result = stratBySector
    }

    res.status(200).json({
      success: true,
      data: result,
      message: 'Data by Sector (Strat): Data retrieved successfully.'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      data: null,
      message: `Data by Sector (Strat): Error retrieving data: ${error.message}`
    });
  }
};

export const getStratBySymbol = async (req, res) => {
  const { symbol } = req.query;

  try {
    const result = await fetchStratBySymbol({ symbol: symbol.toUpperCase() })
    res.status(200).json({
      success: true,
      data: result,
      message: 'Data by Symbol (Strat): Data retrieved successfully.'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      data: null,
      message: `Data by Symbol (Strat): Error retrieving data: ${error.message}`
    });
  }
};

export const getSymbols = async (req, res) => {
  const { search } = req.query;

  try {
    const result = await fetchSymbols({ query: search });
    res.status(200).json({
      success: true,
      data: result,
      message: 'Symbols: Data fetched successfully.'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      data: null,
      message: `Symbols: Error fetching data: ${error.message}`
    });
  }
};

export const getSectorsPerformance = async (req, res) => {
  try {
    const data = await fetchSectorsPerformance();
    res.status(200).json({
      success: true,
      data,
      message: 'Sectors Performance: Data retrieved successfully.'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      data: null,
      message: `Sectors Performance: Error retrieving data: ${error.message}`
    });
  }
};

export const getTopGainers = async (req, res) => {
  try {
    const result = await fetchStratGainers();
    res.status(200).json({
      success: true,
      data: result,
      message: 'Top gainers: Data retrieved successfully.'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      data: null,
      message: `Top gainers: Error retrieving data: ${error.message}`
    });
  }
};

export const getTopLosers = async (req, res) => {
  try {
    const result = await fetchStratLosers();
    res.status(200).json({
      success: true,
      data: result,
      message: 'Top losers: Data retrieved successfully.'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      data: null,
      message: `Top losers: Error retrieving data: ${error.message}`
    });
  }
};

export const getTopVolume = async (req, res) => {
  try {
    const result = await fetchStratVolume();
    res.status(200).json({
      success: true,
      data: result,
      message: 'Top volume: Data retrieved successfully.'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      data: null,
      message: `Top volume: Error retrieving data: ${error.message}`
    });
  }
};

export const addNewInstruments = async (req, res) => {
  const data = req.body

  try {
    const result = await insertNewInstruments({ instruments: data })
    res.status(200).json({
      success: true,
      data: result,
      message: `New instuments: ${result.join(', ')} added successfully.`
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      data: data,
      message: `New Instruments: Error adding data: ${error.message}`
    });
  }
}

export const updateInstruments = async (req, res) => {
  const data = req.body;

  try {
    const result = await editInstruments({ instruments: data });
    res.status(200).json({
      success: true,
      data: result,
      message: 'Instrument(s) updated successfully.'
    });
  } catch (error) {

    let customError;

    if (error.code === '23505' && error.constraint === 'instrument_symbol_key') {
      customError = 'The symbol already exists in the database.';
    } else {
      customError = 'Error updating instrument(s).'
    }

    res.status(500).json({
      success: false,
      data: null,
      message: customError
    });
  }
};

export const deleteInstrument = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await removeInstrument({ id });
    
    if (!result) {
      return res.status(404).json({
        success: false,
        data: null,
        message: `No instrument found with id: ${id}`
      });
    }
    
    res.status(200).json({
      success: true,
      data: result,
      message: `Instrument ${result.symbol} removed successfully.`
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      data: null,
      message: `Error removing instrument: ${error.message}`
    });
  }
};

export const getSectorStockRelations = async (req, res) => {
  try {
    const result = await fetchSectorStockRelations();
    res.status(200).json({
      success: true,
      data: result,
      message: 'Sector-Stock Relations: Data retrieved successfully.'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      data: null,
      message: `Sector-Stock Relations: Error retrieving data: ${error.message}`
    });
  }
};