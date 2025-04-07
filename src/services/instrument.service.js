import { sql } from '../config/database.js';
import { throwError } from '../utils/error.util.js';

export const fetchInstrument = async ({ type }) => {
    try {
        if (type === 'all') {
            return await sql`SELECT * FROM instrument;`
        } else if (type === 'future' || type === 'sector' || type === 'stock') {
            return await sql`SELECT * FROM instrument WHERE category = ${type};`
        } else {
            throwError('Invalid type', 400)
        }
    } catch (error) {
        throw error;
    }
}

export const insertInstrument = async (arrInstrument) => {
    try {
        const results = [];
        
        for (const instrument of arrInstrument) {
            const result = await sql`
                INSERT INTO instrument (symbol, name, category, id_sector)
                VALUES (${instrument.symbol}, ${instrument.name}, ${instrument.category}, ${Number(instrument.id_sector)})
                ON CONFLICT (symbol) DO UPDATE 
                SET name = EXCLUDED.name,
                    category = EXCLUDED.category,
                    id_sector = EXCLUDED.id_sector
                RETURNING id, symbol, category, id_sector,
                  (xmax = 0) as is_insert;  -- true si es inserción, false si es actualización
            `;
            results.push(...result);
        }

        return { id: results.map(row => row.id), count: results.length };
    } catch (error) {
        throw error;
    }
}

export const updateInstrument = async (arrInstrument) => {
    try {
        const results = [];

        for (const instrument of arrInstrument) {
            const result = await sql`
                UPDATE instrument
                SET symbol = ${instrument.symbol},
                name = ${instrument.name},
                category = ${instrument.category},
                id_sector = ${Number(instrument.id_sector)}
                WHERE id = ${Number(instrument.id)}
                RETURNING id, symbol, category, id_sector,
                  (xmax = 0) as is_insert;  -- true si es inserción, false si es actualización
            `;
            results.push(...result);
        }

        return results.filter(row => row.is_insert);
    } catch (error) {
        throw error;
    }
}

export const deleteInstrument = async (arrInstrument) => {
    try {
        const results = [];

        for (const instrument of arrInstrument) {
            const result = await sql`
                DELETE FROM instrument
                WHERE id = ${Number(instrument.id)}
                RETURNING id, symbol, category, id_sector,
                  (xmax = 0) as is_insert;  -- true si es inserción, false si es actualización
            `;
            results.push(...result);
        }

        return results.filter(row => row.is_insert);
    } catch (error) {
        throw error;
    }
}
    