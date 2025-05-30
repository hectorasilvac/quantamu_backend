import { 
  fetchSector,
  insertSector,
  updateSector,
  deleteSector,
  fetchSectorCorrelations
 } from '../services/sector.service.js';

export const getSector = async (req, res) => {
  try {
      const result = await fetchSector()
      res.status(200).json({
          success: true,
          data: result,
          count: result?.length || 0,
          message: 'Sector(s) fetched successfully.'
      })
  } catch (error) {
      res.status(500).json({
          success: false,
          data: null,
          count: 0,
          message: `There was an error fetching the records: ${error?.message || 'Unknown error'}`
      })
  }
}

export const addSector = async (req, res) => {
  const sector = req.body

  try {
      const result = await insertSector(sector)
      res.status(200).json({
          success: true,
          data: result.id,
          count: result.count,
          message: 'Sector(s) inserted successfully.'
      })
  } catch (error) {
      res.status(500).json({
          success: false,
          data: null,
          count: 0,
          message: `There was an error inserting the records: ${error?.message || 'Unknown error'}`
      })
  }
}

export const editSector = async (req, res) => {
  const sector = req.body

  try {
      const result = await updateSector(sector)
      res.status(200).json({
          success: true,
          data: null,
          count: result?.length || 0,
          message: 'Sector(s) updated successfully.'
      })
  } catch (error) {
      res.status(500).json({
          success: false,
          data: null,
          count: 0,
          message: `There was an error updating the records: ${error?.message || 'Unknown error'}`
      })
  }
}

export const removeSector = async (req, res) => {
  const sector = req.body

  try {
      const result = await deleteSector(sector)
      res.status(200).json({
          success: true,
          data: null,
          count: result?.length || 0,
          message: 'Sector(s) deleted successfully.'
      })
  } catch (error) {
      res.status(500).json({
          success: false,
          data: null,
          count: 0,
          message: `There was an error deleting the records: ${error?.message || 'Unknown error'}`
      })
  }
}

export const getSectorCorrelations = async (req, res) => {  
    try {
      const result = await fetchSectorCorrelations();
      res.status(200).json({
        success: true,
        data: result,
        message: 'Sector correlations fetched successfully.'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        data: null,
        message: `Error fetching sector correlations: (${error})`
      });
    }
  }