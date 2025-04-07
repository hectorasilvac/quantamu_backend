import { 
    deleteInstrument, 
    fetchInstrument, 
    insertInstrument, 
    updateInstrument 
} from "../services/instrument.service.js";

export const getInstrument = async (req, res) => {
    const { type } = req.query

    try {
        const result = await fetchInstrument({ type })
        res.status(200).json({
            success: true,
            data: result,
            count: result?.length || 0,
            message: 'Intrument(s) fetched successfully.'
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

export const addInstrument = async (req, res) => {
    const instruments = req.body

    try {
        const result = await insertInstrument(instruments)
        res.status(200).json({
            success: true,
            data: result.id,
            count: result.count,
            message: 'Intrument(s) inserted successfully.'
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

export const editInstrument = async (req, res) => {
    const instruments = req.body

    try {
        const result = await updateInstrument(instruments)
        res.status(200).json({
            success: true,
            data: null,
            count: result?.length || 0,
            message: 'Intrument(s) updated successfully.'
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

export const removeInstrument = async (req, res) => {
    const instruments = req.body

    try {
        const result = await deleteInstrument(instruments)
        res.status(200).json({
            success: true,
            data: null,
            count: result?.length || 0,
            message: 'Intrument(s) deleted successfully.'
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
