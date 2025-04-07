import { sql } from '../config/database.js'

export const fetchSectorStock = async () => {
    try {
        return await sql`
        SELECT id, id_sector, id_stock
        FROM sector_stock
        ORDER BY id;
      `;
    } catch (error) {
        throw error;
    }
}

export const insertSectorStock = async (arrSectorStock) => {
    try {
        const results = [];
        
        for (const sectorStock of arrSectorStock) {
            const result = await sql`
            INSERT INTO sector_stock (id_sector, id_stock)
            VALUES (${sectorStock.id_sector}, ${sectorStock.id_stock})
            ON CONFLICT DO NOTHING
            RETURNING id, id_sector, id_stock,
              (xmax = 0) as is_insert;  -- true si es inserción, false si es actualización
        `;
            results.push(...result);
        }

        return { id: results.map(row => row.id), count: results.length };
    } catch (error) {
        throw error;
    }
}

export const updateSectorStock = async (arrSectorStock) => {
    try {
        const results = [];

        for (const sectorStock of arrSectorStock) {
            const result = await sql`
                UPDATE sector_stock
                SET id_sector = ${sectorStock.id_sector}, id_stock = ${sectorStock.id_stock}
                WHERE id = ${Number(sectorStock.id)}
                RETURNING id, id_sector, id_stock,
                  (xmax = 0) as is_insert;  -- true si es inserción, false si es actualización
            `;
            results.push(...result);
        }

        return results.filter(row => row.is_insert);
    } catch (error) {
        throw error;
    }
}

export const deleteSectorStock = async (arrSectorStock) => {
    try {
        const results = [];

        for (const sectorStock of arrSectorStock) {
            const result = await sql`
                DELETE FROM sector_stock
                WHERE id = ${Number(sectorStock.id)}
                RETURNING id, id_sector, id_stock,
                  (xmax = 0) as is_insert;  -- true si es inserción, false si es actualización
            `;
            results.push(...result);
        }

        return results.filter(row => row.is_insert);
    } catch (error) {
        throw error;
    }
}