import { sql } from '../config/database.js'

export const fetchFutureSector = async () => {
    try {
        return await sql`
        SELECT id, id_future, id_sector
        FROM future_sector
        ORDER BY id;
      `;
    } catch (error) {
        throw error;
    }
}

export const insertFutureSector = async (arrFutureSector) => {
    try {
        const results = [];
        
        for (const futureSector of arrFutureSector) {
            const result = await sql`
            INSERT INTO future_sector (id_future, id_sector)
            VALUES (${futureSector.id_future}, ${futureSector.id_sector})
            ON CONFLICT DO NOTHING
            RETURNING id, id_future, id_sector,
              (xmax = 0) as is_insert;  -- true si es inserción, false si es actualización
        `;
            results.push(...result);
        }

        return { id: results.map(row => row.id), count: results.length };
    } catch (error) {
        throw error;
    }
}

export const updateFutureSector = async (arrFutureSector) => {
    try {
        const results = [];

        for (const futureSector of arrFutureSector) {
            const result = await sql`
                UPDATE future_sector
                SET id_sector = ${futureSector.id_sector}, id_future = ${futureSector.id_future}
                WHERE id = ${Number(futureSector.id)}
                RETURNING id, id_future, id_sector,
                  (xmax = 0) as is_insert;  -- true si es inserción, false si es actualización
            `;
            results.push(...result);
        }

        return results.filter(row => row.is_insert);
    } catch (error) {
        throw error;
    }
}

export const deleteFutureSector = async (arrFutureSector) => {
    try {
        const results = [];

        for (const futureSector of arrFutureSector) {
            const result = await sql`
                DELETE FROM future_sector
                WHERE id = ${Number(futureSector.id)}
                RETURNING id, id_future, id_sector,
                  (xmax = 0) as is_insert;  -- true si es inserción, false si es actualización
            `;
            results.push(...result);
        }

        return results.filter(row => row.is_insert);
    } catch (error) {
        throw error;
    }
}