import { fetchScreener, processDataByFilters } from '../services/screener.service.js';

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
    const filters = req.body;
    try {
        const result = await processDataByFilters({ filters });
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

