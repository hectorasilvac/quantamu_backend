import { 
  fetchSectorStock,
  insertSectorStock,
  updateSectorStock,
  deleteSectorStock,
 } from '../services/sectorStock.service.js';

export const getSectorStock = async (req, res) => {
  try {
      const result = await fetchSectorStock()
      res.status(200).json({
          success: true,
          data: result,
          count: result?.length || 0,
          message: 'Sector-Stock(s) fetched successfully.'
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

export const addSectorStock = async (req, res) => {
  const sectorStock = req.body

  try {
      const result = await insertSectorStock(sectorStock)
      res.status(200).json({
          success: true,
          data: result.id,
          count: result.count,
          message: 'Sector-Stock(s) inserted successfully.'
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

export const editSectorStock = async (req, res) => {
  const sectorStock = req.body

  try {
      const result = await updateSectorStock(sectorStock)
      res.status(200).json({
          success: true,
          data: null,
          count: result?.length || 0,
          message: 'Sector-Stock(s) updated successfully.'
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

export const removeSectorStock = async (req, res) => {
  const sectorStock = req.body

  try {
      const result = await deleteSectorStock(sectorStock)
      res.status(200).json({
          success: true,
          data: null,
          count: result?.length || 0,
          message: 'Sector-Stock(s) deleted successfully.'
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
