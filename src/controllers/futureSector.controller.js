import { 
  fetchFutureSector,
  insertFutureSector,
  updateFutureSector,
  deleteFutureSector,
 } from '../services/futureSector.service.js';

export const getFutureSector = async (req, res) => {
  try {
      const result = await fetchFutureSector()
      res.status(200).json({
          success: true,
          data: result,
          count: result?.length || 0,
          message: 'Future-Sector(s) fetched successfully.'
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

export const addFutureSector = async (req, res) => {
  const futureSector = req.body

  try {
      const result = await insertFutureSector(futureSector)
      res.status(200).json({
          success: true,
          data: result.id,
          count: result.count,
          message: 'Future-Sector(s) inserted successfully.'
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

export const editFutureSector = async (req, res) => {
  const futureSector = req.body

  try {
      const result = await updateFutureSector(futureSector)
      res.status(200).json({
          success: true,
          data: null,
          count: result?.length || 0,
          message: 'Future-Sector(s) updated successfully.'
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

export const removeFutureSector = async (req, res) => {
  const futureSector = req.body

  try {
      const result = await deleteFutureSector(futureSector)
      res.status(200).json({
          success: true,
          data: null,
          count: result?.length || 0,
          message: 'Future-Sector(s) deleted successfully.'
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
