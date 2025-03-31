import { fetchCategories, insertCategory, insertInstrument, insertSectorStock, updateCategory, fetchInstruments } from '../services/db.service.js';

export const addInstrument = async (req, res) => {
  const instruments = req.body;

  try {
    const result = await insertInstrument(instruments);
    res.status(200).json({
      success: true,
      data: result,
      message: 'Instruments: Records added successfully.'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      data: null,
      message: `Instruments: Error adding records. (${error})`
    });
  }
}

export const addCategory = async (req, res) => {
  const { name } = req.query

  try {
    const result = await insertCategory({ name })
    res.status(200).json({
      success: true,
      data: result,
      message: 'Category: Record added successfully.'
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      data: null,
      message: 'Category: Error adding record.'
    })
  }
}

export const editCategory = async (req, res) => {
  const { id, name } = req.query

  try {
    const result = await updateCategory({ id, name })
    res.status(200).json({
      success: true,
      data: result,
      message: 'Category: Record modified successfully.'
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      data: null,
      message: `Category: Error modifying record. (${error})`
    })
  }
}

export const getInstruments = async (req, res) => {
  const { type } = req.query

  try {
    const result = await fetchInstruments({ type })
    res.status(200).json({
      success: true,
      data: result,
      message: 'Instruments: Records fetched successfully.'
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      data: null,
      message: `Instruments: Error fetching records (${error})`
    })
  }
}

export const addSectorStock = async (req, res) => {
  try {
    const records = req.body; // Se espera que el body sea un arreglo directamente
    if (!records || !Array.isArray(records)) {
      return res.status(400).json({
        success: false,
        message: 'Formato inválido. Se requiere enviar un arreglo de objetos con id_sector e id_stock en el body.'
      });
    }
    const result = await insertSectorStock(records);
    res.status(200).json({
      success: true,
      data: result,
      message: 'Registros insertados exitosamente.'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: `Error insertando registros: ${error.message}`
    });
  }
}

export const getCategories = async (req, res) => {
  try {
    const result = await fetchCategories();
    res.status(200).json({
      success: true,
      data: result,
      message: 'Categories retrieved successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      data: null,
      message: `Error retrieving categories: ${error.message}`
    });
  }
};
