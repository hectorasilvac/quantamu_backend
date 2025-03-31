import { neon } from "@neondatabase/serverless";
import dotenv from "dotenv";

dotenv.config();

const sql = neon(process.env.DATABASE_URL);

const initializeDB = async () => {
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS instrument (
        id SERIAL PRIMARY KEY,
        symbol TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        category TEXT NOT NULL CHECK (category IN ('stock','sector','future'))
      )
    `;

    // Resto de tablas
    await sql`
      CREATE TABLE IF NOT EXISTS ohlc (
        id SERIAL PRIMARY KEY,
        id_instrument INTEGER NOT NULL,
        date DATE NOT NULL,
        open NUMERIC(18,6) NOT NULL,
        high NUMERIC(18,6) NOT NULL,
        low NUMERIC(18,6) NOT NULL,
        close NUMERIC(18,6) NOT NULL,
        volume BIGINT NOT NULL,
        FOREIGN KEY (id_instrument) REFERENCES instrument(id) ON DELETE CASCADE,
        CONSTRAINT ohlc_id_instrument_date_unique UNIQUE (id_instrument, date)
      )
    `;
    await sql`CREATE INDEX IF NOT EXISTS idx_ohlc_date ON ohlc(date)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_ohlc_instrument_date ON ohlc(id_instrument, date)`;

    await sql`
      CREATE TABLE IF NOT EXISTS sector_stock (
        id_sector INTEGER NOT NULL,
        id_stock INTEGER NOT NULL,
        FOREIGN KEY (id_sector) REFERENCES instrument(id) ON DELETE CASCADE,
        FOREIGN KEY (id_stock) REFERENCES instrument(id) ON DELETE CASCADE,
        PRIMARY KEY (id_sector, id_stock)
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS future_sector (
        id_future INTEGER NOT NULL,
        id_sector INTEGER NOT NULL,
        FOREIGN KEY (id_future) REFERENCES instrument(id) ON DELETE CASCADE,
        FOREIGN KEY (id_sector) REFERENCES instrument(id) ON DELETE CASCADE,
        PRIMARY KEY (id_future, id_sector)
      )
    `;

    console.log("Database updated successfully.");
  } catch (error) {
    console.error(`Error updating database (${error})`);
  }
};

export { sql, initializeDB };
