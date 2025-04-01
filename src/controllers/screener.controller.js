import { fetchScreener } from '../services/screener.service.js';

export const getScreener = async (req, res) => {  
    try {
      const result = await fetchScreener();
      res.status(200).json({
        success: true,
        data: result,
        message: 'Screener fetched successfully.'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        data: null,
        message: `Screener: Error fetching records. (${error})`
      });
    }
  }

export const getScreenerByFilters = async (req, res) => {
    return res.status(200).json({
        success: true,
        data: req.body || null,
        message: 'Screener fetched successfully.'
    });
}
