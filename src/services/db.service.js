import { sql } from '../config/database.js'

export const fetchInstruments = async ({ type }) => {
  try {

    let query

    if (type === 'all') {
      query = `SELECT * FROM instrument;`
    } else if (type === 'future' || type === 'sector' || type === 'stock') {
      query = `SELECT * FROM instrument WHERE category = '${type}';`
    } else {
      throw new Error(`Invalid type: ${type}`)
    }

    const result = await sql(query)

    return result
  } catch (error) {
    throw error
  }
}

export const insertInstrument = async (instruments) => {
  try {
    const values = instruments
      .map((i) => `('${i.symbol}', '${i.name}', '${i.category}')`)
      .join(',')

    const query = `
      INSERT INTO instrument (symbol, name, category)
      VALUES ${values}
      ON CONFLICT (symbol) DO UPDATE 
      SET name = EXCLUDED.name,
          category = EXCLUDED.category
      RETURNING id, symbol, category,
        (xmax = 0) as is_insert;  -- true si es inserción, false si es actualización
    `
    const result = await sql(query)
    return result.filter(row => row.is_insert)
  } catch (error) {
    throw error
  }
}

export const insertCategory = async ({ name }) => {
  try {
    const result = await sql`
        INSERT INTO category (name) 
        VALUES (${name}) 
        RETURNING id;
      `
    return result[0].id
  } catch (error) {
    throw error
  }
}

export const insertSectorStock = async (records) => {
  if (!records || !records.length) return [];
  const values = records
    .map(r => `(${r.id_sector}, ${r.id_stock})`)
    .join(',');
  const query = `
    INSERT INTO sector_stock (id_sector, id_stock)
    VALUES ${values}
    ON CONFLICT DO NOTHING
    RETURNING *;
  `;
  const result = await sql(query);
  return result;
};

export const updateCategory = async ({ id, name }) => {
  try {
    const result = await sql`
            UPDATE category 
            SET name = ${name} 
            WHERE id = ${id}
            RETURNING id;
        `
    return result[0].id
  } catch (error) {
    throw error
  }
}

export const fetchCategories = async () => {
  try {
    const result = await sql`
      SELECT id, name
      FROM category
      ORDER BY id;
    `;
    return result;
  } catch (error) {
    throw error;
  }
}

export const fetchSectors = async () => {
  try {
    const result = await sql`
      SELECT id, name
      FROM sector
      ORDER BY id;
    `;
    return result;
  } catch (error) {
    throw error;
  }
}

