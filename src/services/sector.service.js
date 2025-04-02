import { sql } from '../config/database.js'

export const fetchMarketSectors = async () => {
    try {
        // Obtener todos los futuros
        const futures = await sql`
            SELECT id, symbol, name 
            FROM instrument 
            WHERE category = 'future'
        `;

        // Procesar cada futuro para obtener sus sectores relacionados
        const result = await Promise.all(
            futures.map(async (future) => {
                // Obtener sectores relacionados con este futuro
                const sectors = await sql`
                    SELECT s.id, s.name
                    FROM sector s
                    WHERE s.id_future = ${future.id}
                `;

                // Para cada sector, obtener sus ETFs relacionados
                const sectorsWithEtfs = await Promise.all(
                    sectors.map(async (sector) => {
                        // Obtener ETFs directamente de la tabla instrument
                        const etfs = await sql`
                            SELECT symbol
                            FROM instrument
                            WHERE category = 'sector'
                            AND id_sector = ${sector.id}
                        `;

                        return {
                            id: sector.id,
                            name: sector.name,
                            etfs: etfs.map(etf => etf.symbol)
                        };
                    })
                );

                return {
                    id: future.id,
                    symbol: future.symbol,
                    name: future.name,
                    sectors: sectorsWithEtfs
                };
            })
        );

        return result;
    } catch (error) {
        throw error;
    }
}   
