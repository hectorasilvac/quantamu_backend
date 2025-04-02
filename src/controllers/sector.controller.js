import { fetchMarketSectors } from '../services/sector.service.js';

export const getMarketSectors = async (req, res) => {  
    try {
      const result = await fetchMarketSectors();
      res.status(200).json({
        success: true,
        data: result,
        message: 'Market sectors fetched successfully.'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        data: null,
        message: `Market sectors: Error fetching records. (${error})`
      });
    }
  }