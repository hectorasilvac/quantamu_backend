import { sql } from '../config/database.js'
import axios from 'axios'
import dayjs from 'dayjs'

import {
  getAvgVolume,
  getCandlePattern,
  getContinuity,
  getPoints,
  getPotentialEntry,
  getScenario,
  getUnusualVolume
} from '../utils/strat.util.js'
import { getFormattedDate } from '../utils/date.utils.js'
import { fetchInstruments, insertInstrument } from './db.service.js'

const makeRequest = async ({ date, baseUrl, apiKey }) => {
  try {
    const response = await axios.get(
      `${baseUrl}/${date}?adjusted=true&include_otc=true&apiKey=${apiKey}`
    )

    return response.data.results
  } catch (error) {
    if (error.response && error.response.status === 403) {
      const yesterdayDate = getFormattedDate(1)
      return makeRequest({ date: yesterdayDate, baseUrl, apiKey })

    } else if (error.response && error.response.status === 429) {
      const backupApiKey = process.env.BACKUP_POLYGON_API_KEY; 
      return makeRequest({ date: date, baseUrl, apiKey: backupApiKey })
    }
    throw error
  }
}

export const addStratData = async ({ arrObject }) => {
  return (await Promise.all(
    arrObject.map(async ({ symbol, daily, weekly, monthly, quarterly }) => {
      if (!daily?.[1] || !weekly?.[1] || !monthly?.[1] || !quarterly?.[1]) {
        return null;
      }

      const [
        dailyScenario,
        weeklyScenario,
        monthlyScenario,
        quarterlyScenario,
        dailyPattern,
        weeklyPattern,
        monthlyPattern,
        quarterlyPattern,
        unusualVolume
      ] = await Promise.all([
        getScenario({
          recentHigh: daily[0].high,
          recentLow: daily[0].low,
          previousHigh: daily[1].high,
          previousLow: daily[1].low
        }),
        getScenario({
          recentHigh: weekly[0].high,
          recentLow: weekly[0].low,
          previousHigh: weekly[1].high,
          previousLow: weekly[1].low
        }),
        getScenario({
          recentHigh: monthly[0].high,
          recentLow: monthly[0].low,
          previousHigh: monthly[1].high,
          previousLow: monthly[1].low
        }),
        getScenario({
          recentHigh: quarterly[0].high,
          recentLow: quarterly[0].low,
          previousHigh: quarterly[1].high,
          previousLow: quarterly[1].low
        }),
        getCandlePattern({
          open: daily[0].open,
          high: daily[0].high,
          low: daily[0].low,
          close: daily[0].close
        }),
        getCandlePattern({
          open: weekly[0].open,
          high: weekly[0].high,
          low: weekly[0].low,
          close: weekly[0].close
        }),
        getCandlePattern({
          open: monthly[0].open,
          high: monthly[0].high,
          low: monthly[0].low,
          close: monthly[0].close
        }),
        getCandlePattern({
          open: quarterly[0].open,
          high: quarterly[0].high,
          low: quarterly[0].low,
          close: quarterly[0].close
        }),
        getUnusualVolume(daily)
      ])

      const [weeklyContinuity, monthlyContinuity, quarterlyContinuity] =
        await Promise.all([
          getContinuity({
            tfOpen: weekly[0].open,
            tfClose: weekly[0].close,
            dailyHigh: daily[0].high,
            dailyLow: daily[0].low,
            dailyClose: daily[0].close,
            dailyScenario
          }),
          getContinuity({
            tfOpen: monthly[0].open,
            tfClose: monthly[0].close,
            dailyHigh: daily[0].high,
            dailyLow: daily[0].low,
            dailyClose: daily[0].close,
            dailyScenario
          }),
          getContinuity({
            tfOpen: quarterly[0].open,
            tfClose: quarterly[0].close,
            dailyHigh: daily[0].high,
            dailyLow: daily[0].low,
            dailyClose: daily[0].close,
            dailyScenario
          })
        ])

        const avgVolume = getAvgVolume({ data: daily });
        const weeklyVolume = weekly[0].volume;
        const lastPrice = daily[0].close;
        const percentageChange = ((daily[0].close - daily[1].close) / daily[1].close) * 100;
        const priceChange = Math.abs(daily[0].close - daily[1].close);
        const lastDay = daily[0].date;

      const [potentialEntry] = await Promise.all([
        getPotentialEntry({
          weeklyData: weekly,
          dailyData: daily,
          avgVolume,
          weeklyContinuity,
          monthlyContinuity,
          quarterlyContinuity,
          dailyScenario,
          weeklyScenario,
          monthlyScenario,
          quarterlyScenario,
          dailyPattern,
        })
      ])

      const points = getPoints({
        weeklyScenario,
        monthlyScenario,
        quarterlyScenario,
        weeklyContinuity,
        monthlyContinuity,
        quarterlyContinuity,
        dailyPattern,
        weeklyPattern,
        monthlyPattern,
        quarterlyPattern,
        unusualVolume,
        potentialEntry,
        weeklyVolume,
        avgVolume,
      });

      return {
        symbol,
        dailyScenario,
        weeklyScenario,
        monthlyScenario,
        quarterlyScenario,
        weeklyContinuity,
        monthlyContinuity,
        quarterlyContinuity,
        dailyPattern,
        weeklyPattern,
        monthlyPattern,
        quarterlyPattern,
        unusualVolume,
        potentialEntry,
        avgVolume,
        weeklyVolume,
        lastPrice,
        percentageChange,
        priceChange,
        lastDay,
        points,
      }
    })
  )).filter(Boolean);
}

export const fetchAggregatedData = async ({ symbols = [], limit = 999999, isSector = null }) => {
  if (!Array.isArray(symbols)) {
    symbols = [symbols]
  }

  let assets;

  if (isSector === 0) {
    assets = await sql`
      SELECT i.id, i.symbol, s.name as sector_name
      FROM instrument i
      LEFT JOIN sector s ON i.id_sector = s.id
      WHERE i.category != 'future'
    `
    
    symbols = assets.map((asset) => asset.symbol);

  } else if (isSector > 0) {
    assets = await sql`
      SELECT i.id, i.symbol, s.name as sector_name
      FROM instrument i
      LEFT JOIN sector s ON i.id_sector = s.id
      WHERE i.id_sector = ${isSector}
    `;
    
    symbols = assets.map((asset) => asset.symbol);

  } else {
    assets = await sql`
      SELECT i.id, i.symbol, s.name as sector_name
      FROM instrument i
      LEFT JOIN sector s ON i.id_sector = s.id
      WHERE i.symbol = ANY(${symbols})
    `
  }

  if (!assets.length) {
    throw new Error('No assets found for the provided symbols')
  }

  // Crear un mapa para facilitar la búsqueda del id y sector_name por símbolo
  const assetMap = {}
  const sectorMap = {}
  assets.forEach((asset) => {
    assetMap[asset.symbol] = asset.id
    sectorMap[asset.symbol] = asset.sector_name
  })
  const assetIds = Object.values(assetMap)

  if (!assetIds.length) {
    throw new Error('No asset IDs found for the provided symbols')
  }

  const [dailyData, weeklyData, monthlyData, quarterlyData] = await Promise.all(
    [
      // Daily
      sql`
      SELECT * FROM (
        SELECT 
          id_instrument AS "assetId",
          date,
          open,
          high,
          low,
          close,
          volume,
          ROW_NUMBER() OVER (PARTITION BY id_instrument ORDER BY date DESC) as rn
        FROM ohlc
        WHERE id_instrument = ANY(${assetIds})
      ) ranked
      WHERE rn <= ${limit}
      ORDER BY "assetId", date DESC
    `,
      // Weekly
      sql`
      SELECT * FROM (
        SELECT 
          id_instrument AS "assetId",
          MIN(date) AS date,
          (array_agg(open ORDER BY date ASC))[1] AS open,
          MAX(high) AS high,
          MIN(low) AS low,
          (array_agg(close ORDER BY date DESC))[1] AS close,
          SUM(volume) AS volume,
          ROW_NUMBER() OVER (PARTITION BY id_instrument ORDER BY date_trunc('week', date) DESC) AS rn
        FROM ohlc
        WHERE id_instrument = ANY(${assetIds})
        GROUP BY id_instrument, date_trunc('week', date)
      ) ranked
      WHERE rn <= ${limit}
      ORDER BY "assetId", date DESC
    `,
      // Monthly
      sql`
      SELECT * FROM (
        SELECT 
          id_instrument AS "assetId",
          MIN(date) AS date,
          (array_agg(open ORDER BY date ASC))[1] AS open,
          MAX(high) AS high,
          MIN(low) AS low,
          (array_agg(close ORDER BY date DESC))[1] AS close,
          SUM(volume) AS volume,
          ROW_NUMBER() OVER (PARTITION BY id_instrument ORDER BY date_trunc('month', date) DESC) AS rn
        FROM ohlc
        WHERE id_instrument = ANY(${assetIds})
        GROUP BY id_instrument, date_trunc('month', date)
      ) ranked
      WHERE rn <= ${limit}
      ORDER BY "assetId", date DESC
    `,
      // Quarterly
      sql`
      SELECT * FROM (
        SELECT 
          id_instrument AS "assetId",
          MIN(date) AS date,
          (array_agg(open ORDER BY date ASC))[1] AS open,
          MAX(high) AS high,
          MIN(low) AS low,
          (array_agg(close ORDER BY date DESC))[1] AS close,
          SUM(volume) AS volume,
          ROW_NUMBER() OVER (PARTITION BY id_instrument ORDER BY date_trunc('quarter', date) DESC) AS rn
        FROM ohlc
        WHERE id_instrument = ANY(${assetIds})
        GROUP BY id_instrument, date_trunc('quarter', date)
      ) ranked
      WHERE rn <= ${limit}
      ORDER BY "assetId", date DESC
    `
    ]
  )

  // Función para formatear los datos numéricos y de fecha
  const formatData = (data) =>
    data.map((row) => ({
      date: dayjs(row.date).format('YYYY-MM-DD'),
      open: +row.open,
      high: +row.high,
      low: +row.low,
      close: +row.close,
      volume: +row.volume
    }))

  // Construir la respuesta final agrupando cada símbolo
  return symbols.map((symbol) => {
    const assetId = assetMap[symbol]
    return {
      symbol,
      sectorName: sectorMap[symbol] || null,
      daily: formatData(dailyData.filter((d) => d.assetId === assetId)),
      weekly: formatData(weeklyData.filter((d) => d.assetId === assetId)),
      monthly: formatData(monthlyData.filter((d) => d.assetId === assetId)),
      quarterly: formatData(quarterlyData.filter((d) => d.assetId === assetId))
    }
  })
}

export const fetchSymbols = async ({ query } = {}) => {
  if (query) {
    const upperQuery = query.toUpperCase();
    return await sql`
      SELECT i.symbol, i.name,
        COALESCE(sub.sectors, ARRAY[]::text[]) AS sectors
      FROM instrument i
      LEFT JOIN (
        SELECT ss.id_stock, array_agg(s.symbol) AS sectors
        FROM sector_stock ss
        JOIN instrument s ON s.id = ss.id_sector
        GROUP BY ss.id_stock
      ) sub ON i.id = sub.id_stock
      WHERE i.symbol ILIKE ${upperQuery + '%'} OR i.name ILIKE ${'%' + query + '%'}
      ORDER BY 
        CASE 
          WHEN i.symbol = ${upperQuery} THEN 1
          WHEN i.symbol ILIKE ${upperQuery + '%'} THEN 2
          ELSE 3
        END,
        i.symbol ASC
      LIMIT 10;
    `;
  }
  return await sql`
    SELECT i.symbol, i.name,
      COALESCE(sub.sectors, ARRAY[]::text[]) AS sectors
    FROM instrument i
    LEFT JOIN (
      SELECT ss.id_stock, array_agg(s.symbol) AS sectors
      FROM sector_stock ss
      JOIN instrument s ON s.id = ss.id_sector
      GROUP BY ss.id_stock
    ) sub ON i.id = sub.id_stock;
  `;
}

export const fetchApi = async ({ customDate }) => {
  const baseUrl =
    'https://api.polygon.io/v2/aggs/grouped/locale/us/market/stocks'
  const apiKey = process.env.POLYGON_API_KEY

  let date

  if (customDate) {
    date = customDate
  } else {
    const today = getFormattedDate()
    date = today
  }

  return await makeRequest({ date, baseUrl, apiKey })
}

export const fetchApiByDate = async ({ symbol, startDate, endDate}) => {
const apiKey = process.env.POLYGON_API_KEY
  const baseUrl = `https://api.polygon.io/v2/aggs/ticker/${symbol}/range/1/day/${startDate}/${endDate}?adjusted=true&sort=asc&apiKey=${apiKey}`

  try {
    const response = await axios.get(baseUrl);
    return response.data.results;

  } catch(error) {
    throw error;
  }
}

export const fetchGroupedOhlcData = async ({ symbols } = {}) => {
  try {
    let filterClause = ''

    if (symbols) {
      const symbolsArray = Array.isArray(symbols) ? symbols : [symbols]
      filterClause = ` AND symbol IN (${symbolsArray
        .map((s) => `'${s}'`)
        .join(',')}) `
    }

    const query = `
      SELECT symbol, date, open, high, low, close, volume FROM (
        SELECT 
          i.symbol, o.date, o.open, o.high, o.low, o.close, o.volume,
          ROW_NUMBER() OVER (PARTITION BY i.symbol ORDER BY o.date DESC) as rn
        FROM ohlc o
        JOIN instrument i ON o.id_instrument = i.id
      ) sub
      WHERE rn <= 30 ${filterClause}
      ORDER BY symbol, date DESC;
    `
    const rows = await sql(query)
    const grouped = rows.reduce((acc, row) => {
      if (!acc[row.symbol]) {
        acc[row.symbol] = []
      }
      acc[row.symbol].push({
        date: dayjs(row.date).format('YYYY-MM-DD'),
        open: row.open,
        high: row.high,
        low: row.low,
        close: row.close,
        volume: row.volume
      })
      return acc
    }, {})

    return Object.keys(grouped).map((symbol) => ({
      symbol,
      data: grouped[symbol]
    }))
  } catch (error) {
    throw new Error(`Error fetching grouped OHLC data: ${error.message}`)
  }
}

export const formatOhlcFromApi = async ({ customDate }) => {
  try {
    const getQuotes = await fetchApi({ customDate })
    const getInstruments = await fetchInstruments({ type: 'all' })

    const instrumentMap = new Map(
      getInstruments.map((inst) => [inst.symbol, inst.id])
    )

    const formattedData = getQuotes
      .filter((quote) => instrumentMap.has(quote.T))
      .map((quote) => ({
        id_instrument: instrumentMap.get(quote.T),
        date: dayjs(quote.t).format('YYYY-MM-DD'),
        open: quote.o,
        high: quote.h,
        low: quote.l,
        close: quote.c,
        volume: quote.v
      }))


    return formattedData
  } catch (error) {
    throw error;
  }
}

export const insertOhlcBatch = async ({ ohlcData }) => {
  try {
    if (!ohlcData.length) return []

    const values = ohlcData
      .map(
        (d) =>
          `(${d.id_instrument}, '${d.date}', ${d.open}, ${d.high}, ${d.low}, ${d.close}, ${d.volume})`
      )
      .join(',')

    const query = `
      INSERT INTO ohlc (id_instrument, date, open, high, low, close, volume)
      VALUES ${values}
      ON CONFLICT (id_instrument, date) DO NOTHING
      RETURNING *;
    `

    const result = await sql(query)
    return result
  } catch (error) {
    throw new Error(`Error inserting OHLC data: ${error.message}`)
  }
}

export const fetchSectorsData = async () => {
  try {
    const query = `
      SELECT 
        f.id, 
        f.symbol, 
        f.name, 
        COALESCE(
          json_agg(
            DISTINCT jsonb_build_object(
              'id', s.id,
              'symbol', s.symbol,
              'name', s.name
            )
          ) FILTER (WHERE s.id IS not null), '[]'
        ) AS sectors
      FROM future_sector fs
      JOIN instrument f ON fs.id_future = f.id
      JOIN (
        SELECT id, symbol, name 
        FROM instrument 
        WHERE category = 'sector' 
          AND id IN (SELECT DISTINCT id_sector FROM sector_stock)
      ) s ON fs.id_sector = s.id
      GROUP BY f.id, f.symbol, f.name
      ORDER BY f.id;
    `
    const result = await sql(query)
    return result
  } catch (error) {
    throw new Error(`Error fetching future data: ${error.message}`)
  }
}

export const fetchStratSectors = async () => {
  const sectorSymbols = await fetchInstruments({ type: 'sector' });
  const arrSymbols = sectorSymbols
    .map((s) => s.symbol)
    .join(',')
    .split(',')
    .map((s) => s.trim());
  const aggSectors = await fetchAggregatedData({ symbols: arrSymbols });
  const stratData = await addStratData({ arrObject: aggSectors });

  return stratData;
};

export const fetchStratBySector = async ({ symbol }) => {

  const sector = await sql`SELECT id FROM instrument WHERE symbol = ${symbol} LIMIT 1`;
  if (!sector[0]) {
    throw new Error(`No sector found with this symbol: ${symbol}`);
  }
  const stocks = await sql`
    SELECT i.symbol 
    FROM instrument i
    JOIN sector_stock ss ON i.id = ss.id_stock
    WHERE ss.id_sector = ${sector[0].id}
  `;

  if (stocks.length === 0) 
  {
    return [];
  }
  
  const arrSymbols = stocks.map(row => row.symbol);
  const aggSectors = await fetchAggregatedData({ symbols: arrSymbols });
  const stratData = await addStratData({ arrObject: aggSectors });

  return stratData;
};

export const fetchStratBySymbol = async ({ symbol }) => {
  let symbols = symbol;
  
  if (typeof symbol === 'string') {
    if (symbol.includes(',')) {
      symbols = symbol.split(',').map(s => s.trim().toUpperCase());
    } else {
      symbols = symbol.toUpperCase();
    }
  }

  const aggSectors = await fetchAggregatedData({ symbols });
  const stratData = await addStratData({ arrObject: aggSectors });

  return stratData;
};

export const fetchSectorsPerformance = async () => {
  try {
    // Calcular rendimientos para diferentes períodos
    const sql_query = `
      WITH time_periods AS (
        SELECT 'latest_date' AS period_name, MAX(date) AS ref_date FROM ohlc
        UNION ALL
        SELECT '1d_ago', MAX(date) FROM ohlc WHERE date < (SELECT MAX(date) FROM ohlc)
        UNION ALL
        SELECT '1w_ago', MAX(date) FROM ohlc WHERE date <= (SELECT MAX(date) FROM ohlc) - INTERVAL '7 days'
        UNION ALL
        SELECT '1m_ago', MAX(date) FROM ohlc WHERE date <= (SELECT MAX(date) FROM ohlc) - INTERVAL '1 month'
        UNION ALL
        SELECT '3m_ago', MAX(date) FROM ohlc WHERE date <= (SELECT MAX(date) FROM ohlc) - INTERVAL '3 months'
        UNION ALL
        SELECT 'ytd_start', MAX(date) FROM ohlc WHERE EXTRACT(YEAR FROM date) = EXTRACT(YEAR FROM (SELECT MAX(date) FROM ohlc)) AND EXTRACT(MONTH FROM date) = 1 AND EXTRACT(DAY FROM date) <= 7
      ),
      sector_prices AS (
        SELECT 
          i.id AS sector_id,
          i.symbol,
          i.name,
          tp.period_name,
          o.date,
          o.close,
          ROW_NUMBER() OVER (PARTITION BY i.id, tp.period_name ORDER BY ABS(o.date - tp.ref_date)) AS rn
        FROM instrument i
        JOIN ohlc o ON o.id_instrument = i.id
        CROSS JOIN time_periods tp
        WHERE i.category = 'sector'
      ),
      closest_prices AS (
        SELECT 
          sector_id, 
          symbol,
          name,
          period_name, 
          close 
        FROM sector_prices
        WHERE rn = 1
      ),
      period_calculations AS (
        SELECT 
          latest.sector_id,
          latest.symbol,
          latest.name,
          CASE 
            WHEN day1.close IS NOT NULL AND day1.close != 0 THEN 
              ROUND(((latest.close - day1.close) / day1.close) * 100, 1)
            ELSE NULL
          END AS perf_1d,
          CASE 
            WHEN week1.close IS NOT NULL AND week1.close != 0 THEN 
              ROUND(((latest.close - week1.close) / week1.close) * 100, 1)
            ELSE NULL
          END AS perf_1w,
          CASE 
            WHEN month1.close IS NOT NULL AND month1.close != 0 THEN 
              ROUND(((latest.close - month1.close) / month1.close) * 100, 1)
            ELSE NULL
          END AS perf_1m,
          CASE 
            WHEN month3.close IS NOT NULL AND month3.close != 0 THEN 
              ROUND(((latest.close - month3.close) / month3.close) * 100, 1)
            ELSE NULL
          END AS perf_3m,
          CASE 
            WHEN ytd.close IS NOT NULL AND ytd.close != 0 THEN 
              ROUND(((latest.close - ytd.close) / ytd.close) * 100, 1)
            ELSE NULL
          END AS perf_ytd
        FROM closest_prices latest
        LEFT JOIN closest_prices day1 ON latest.sector_id = day1.sector_id AND day1.period_name = '1d_ago'
        LEFT JOIN closest_prices week1 ON latest.sector_id = week1.sector_id AND week1.period_name = '1w_ago'
        LEFT JOIN closest_prices month1 ON latest.sector_id = month1.sector_id AND month1.period_name = '1m_ago'
        LEFT JOIN closest_prices month3 ON latest.sector_id = month3.sector_id AND month3.period_name = '3m_ago'
        LEFT JOIN closest_prices ytd ON latest.sector_id = ytd.sector_id AND ytd.period_name = 'ytd_start'
        WHERE latest.period_name = 'latest_date'
      )
      SELECT 
        symbol,
        name,
        perf_1d,
        perf_1w,
        perf_1m,
        perf_3m,
        perf_ytd
      FROM period_calculations
      WHERE symbol IS NOT NULL
      ORDER BY symbol;
    `;

    const sectors = await sql(sql_query);

    // Reorganizar los resultados en el formato solicitado
    const formatPeriodData = (sectors, performanceKey) => {
      // Filtrar sectores con rendimiento válido para este período
      const validSectors = sectors.filter(s => s[performanceKey] !== null);
      
      // Ordenar para identificar ganadores y perdedores
      const sortedSectors = [...validSectors].sort((a, b) => b[performanceKey] - a[performanceKey]);
      
      // Crear objetos con el formato requerido
      const formattedSectors = sortedSectors.map(s => ({
        symbol: s.symbol,
        name: s.name,
        performance: s[performanceKey]
      }));
      
      // Dividir en ganadores y perdedores
      const gainers = formattedSectors.filter(s => s.performance > 0);
      const losers = formattedSectors.filter(s => s.performance < 0).sort((a, b) => a.performance - b.performance);
      
      return {
        gainers,
        losers
      };
    };

    // Crear el objeto de respuesta
    const result = {
      "1d": formatPeriodData(sectors, "perf_1d"),
      "1w": formatPeriodData(sectors, "perf_1w"),
      "1m": formatPeriodData(sectors, "perf_1m"),
      "3m": formatPeriodData(sectors, "perf_3m"),
      "ytd": formatPeriodData(sectors, "perf_ytd")
    };

    return result;
  } catch (error) {
    throw new Error(`Error fetching sectors performance: ${error.message}`);
  }
};

export const fetchGainersAndLosers = async () => {
  try {
    // Calcular rendimientos para diferentes períodos
    const sql_query = `
      WITH time_periods AS (
        SELECT 'latest_date' AS period_name, MAX(date) AS ref_date FROM ohlc
        UNION ALL
        SELECT '1d_ago', MAX(date) FROM ohlc WHERE date < (SELECT MAX(date) FROM ohlc)
        UNION ALL
        SELECT '1w_ago', MAX(date) FROM ohlc WHERE date <= (SELECT MAX(date) FROM ohlc) - INTERVAL '7 days'
        UNION ALL
        SELECT '1m_ago', MAX(date) FROM ohlc WHERE date <= (SELECT MAX(date) FROM ohlc) - INTERVAL '1 month'
        UNION ALL
        SELECT '3m_ago', MAX(date) FROM ohlc WHERE date <= (SELECT MAX(date) FROM ohlc) - INTERVAL '3 months'
        UNION ALL
        SELECT 'ytd_start', MAX(date) FROM ohlc WHERE EXTRACT(YEAR FROM date) = EXTRACT(YEAR FROM (SELECT MAX(date) FROM ohlc)) AND EXTRACT(MONTH FROM date) = 1 AND EXTRACT(DAY FROM date) <= 7
      ),
      stock_prices AS (
        SELECT 
          i.id AS stock_id,
          i.symbol,
          i.name,
          tp.period_name,
          o.date,
          o.close,
          ROW_NUMBER() OVER (PARTITION BY i.id, tp.period_name ORDER BY ABS(o.date - tp.ref_date)) AS rn
        FROM instrument i
        JOIN ohlc o ON o.id_instrument = i.id
        CROSS JOIN time_periods tp
        WHERE i.category = 'stock'
      ),
      closest_prices AS (
        SELECT 
          stock_id, 
          symbol,
          name,
          period_name, 
          close 
        FROM stock_prices
        WHERE rn = 1
      ),
      period_calculations AS (
        SELECT 
          latest.stock_id,
          latest.symbol,
          latest.name,
          CASE 
            WHEN day1.close IS NOT NULL AND day1.close != 0 THEN 
              ROUND(((latest.close - day1.close) / day1.close) * 100, 1)
            ELSE NULL
          END AS perf_1d,
          CASE 
            WHEN week1.close IS NOT NULL AND week1.close != 0 THEN 
              ROUND(((latest.close - week1.close) / week1.close) * 100, 1)
            ELSE NULL
          END AS perf_1w,
          CASE 
            WHEN month1.close IS NOT NULL AND month1.close != 0 THEN 
              ROUND(((latest.close - month1.close) / month1.close) * 100, 1)
            ELSE NULL
          END AS perf_1m,
          CASE 
            WHEN month3.close IS NOT NULL AND month3.close != 0 THEN 
              ROUND(((latest.close - month3.close) / month3.close) * 100, 1)
            ELSE NULL
          END AS perf_3m,
          CASE 
            WHEN ytd.close IS NOT NULL AND ytd.close != 0 THEN 
              ROUND(((latest.close - ytd.close) / ytd.close) * 100, 1)
            ELSE NULL
          END AS perf_ytd
        FROM closest_prices latest
        LEFT JOIN closest_prices day1 ON latest.stock_id = day1.stock_id AND day1.period_name = '1d_ago'
        LEFT JOIN closest_prices week1 ON latest.stock_id = week1.stock_id AND week1.period_name = '1w_ago'
        LEFT JOIN closest_prices month1 ON latest.stock_id = month1.stock_id AND month1.period_name = '1m_ago'
        LEFT JOIN closest_prices month3 ON latest.stock_id = month3.stock_id AND month3.period_name = '3m_ago'
        LEFT JOIN closest_prices ytd ON latest.stock_id = ytd.stock_id AND ytd.period_name = 'ytd_start'
        WHERE latest.period_name = 'latest_date'
      )
      SELECT 
        symbol,
        name,
        perf_1d,
        perf_1w,
        perf_1m,
        perf_3m,
        perf_ytd
      FROM period_calculations
      WHERE symbol IS NOT NULL
      ORDER BY symbol;
    `;

    const stocks = await sql(sql_query);

    // Reorganizar los resultados en el formato solicitado con límite de 20 por categoría
    const formatPeriodData = (stocks, performanceKey) => {
      // Filtrar stocks con rendimiento válido para este período
      const validStocks = stocks.filter(s => s[performanceKey] !== null);
      
      // Ordenar para identificar ganadores y perdedores
      const sortedStocks = [...validStocks].sort((a, b) => b[performanceKey] - a[performanceKey]);
      
      // Crear objetos con el formato requerido
      const formattedStocks = sortedStocks.map(s => ({
        symbol: s.symbol,
        name: s.name,
        performance: s[performanceKey]
      }));
      
      // Dividir en ganadores y perdedores limitando a 20 cada uno
      const gainers = formattedStocks.filter(s => s.performance > 0).slice(0, 20);
      const losers = formattedStocks.filter(s => s.performance < 0).sort((a, b) => a.performance - b.performance).slice(0, 20);
      
      return {
        gainers,
        losers
      };
    };

    // Crear el objeto de respuesta
    const result = {
      "1d": formatPeriodData(stocks, "perf_1d"),
      "1w": formatPeriodData(stocks, "perf_1w"),
      "1m": formatPeriodData(stocks, "perf_1m"),
      "3m": formatPeriodData(stocks, "perf_3m"),
      "ytd": formatPeriodData(stocks, "perf_ytd")
    };

    return result;
  } catch (error) {
    throw new Error(`Error fetching gainers and losers: ${error.message}`);
  }
};

export const fetchTopGainers = async ({ limit = 10 }) => {
  try {
    const result = await sql`
      WITH latest_date AS (
        SELECT MAX(date) as max_date
        FROM ohlc
      ),
      previous_date AS (
        SELECT MAX(date) as prev_date
        FROM ohlc
        WHERE date < (SELECT max_date FROM latest_date)
      ),
      price_changes AS (
        SELECT 
          o1.id_instrument,
          o1.close as current_close,
          o2.close as prev_close
        FROM ohlc o1
        JOIN ohlc o2 ON o1.id_instrument = o2.id_instrument
        WHERE o1.date = (SELECT max_date FROM latest_date)
        AND o2.date = (SELECT prev_date FROM previous_date)
      )
      SELECT i.symbol, 
             ((pc.current_close - pc.prev_close) / pc.prev_close * 100) as change_percent
      FROM price_changes pc
      JOIN instrument i ON i.id = pc.id_instrument
      WHERE pc.prev_close > 0 
      AND pc.current_close IS NOT NULL 
      AND pc.prev_close IS NOT NULL
      ORDER BY change_percent DESC
      LIMIT ${limit}
    `;
    
    return result.map(row => row.symbol);
  } catch (error) {
    throw new Error(`Error fetching top gainers: ${error.message}`);
  }
};

export const fetchStratGainers = async () => {
  const arrSymbols = await fetchTopGainers({ limit: 10 });
  const aggSectors = await fetchAggregatedData({ symbols: arrSymbols });
  const stratData = await addStratData({ arrObject: aggSectors });

  return stratData;
}

export const fetchTopLosers = async ({ limit = 10 }) => {
  try {
    const result = await sql`
      WITH latest_date AS (
        SELECT MAX(date) as max_date
        FROM ohlc
      ),
      previous_date AS (
        SELECT MAX(date) as prev_date
        FROM ohlc
        WHERE date < (SELECT max_date FROM latest_date)
      ),
      price_changes AS (
        SELECT 
          o1.id_instrument,
          o1.close as current_close,
          o2.close as prev_close
        FROM ohlc o1
        JOIN ohlc o2 ON o1.id_instrument = o2.id_instrument
        WHERE o1.date = (SELECT max_date FROM latest_date)
        AND o2.date = (SELECT prev_date FROM previous_date)
      )
      SELECT i.symbol, 
             ((pc.current_close - pc.prev_close) / pc.prev_close * 100) as change_percent
      FROM price_changes pc
      JOIN instrument i ON i.id = pc.id_instrument
      WHERE pc.prev_close > 0 
      AND pc.current_close IS NOT NULL 
      AND pc.prev_close IS NOT NULL
      ORDER BY change_percent ASC
      LIMIT ${limit}
    `;
    
    return result.map(row => row.symbol);
  } catch (error) {
    throw new Error(`Error fetching top losers: ${error.message}`);
  }
};

export const fetchStratLosers = async () => {
  const arrSymbols = await fetchTopLosers({ limit: 10 });
  const aggSectors = await fetchAggregatedData({ symbols: arrSymbols });
  const stratData = await addStratData({ arrObject: aggSectors });

  return stratData;
}

export const fetchTopVolume = async ({ limit = 10 }) => {
  try {
    const result = await sql`
      WITH latest_date AS (
        SELECT MAX(date) as max_date
        FROM ohlc
      )
      SELECT i.symbol,
             o.volume
      FROM ohlc o
      JOIN instrument i ON i.id = o.id_instrument
      WHERE o.date = (SELECT max_date FROM latest_date)
      AND o.volume IS NOT NULL
      AND o.volume > 0
      ORDER BY o.volume DESC
      LIMIT ${limit}
    `;
    
    return result.map(row => row.symbol);
  } catch (error) {
    throw new Error(`Error fetching top volume: ${error.message}`);
  }
};

export const fetchStratVolume = async () => {
  const arrSymbols = await fetchTopVolume({ limit: 10 });
  const aggSectors = await fetchAggregatedData({ symbols: arrSymbols });
  const stratData = await addStratData({ arrObject: aggSectors });

  return stratData;
}

export const insertNewInstruments = async ({ instruments }) => {
  try {
    const newInstruments = await insertInstrument(instruments);

    const arrInstruments = newInstruments.map(newInst => {
      const matchingInstrument = instruments.find(inst => inst.symbol === newInst.symbol);
      if (matchingInstrument) {
        return {
          ...newInst,
          startDate: matchingInstrument.startDate,
          endDate: matchingInstrument.endDate
        };
      }
      return newInst;
    });

    const formattedOhlcData = await Promise.all(
      arrInstruments.map(async (instrument) => {
        try {
          const apiData = await fetchApiByDate({
            symbol: instrument.symbol,
            startDate: instrument.startDate,
            endDate: instrument.endDate
          });
  
          return apiData.map(quote => ({
            id_instrument: instrument.id,
            date: dayjs(quote.t).format('YYYY-MM-DD'),
            open: quote.o,
            high: quote.h,
            low: quote.l,
            close: quote.c,
            volume: quote.v
          }));
        } catch (error) {
          console.error(`Error fetching data for ${instrument.symbol}:`, error);
          return [];
        }
      })
    );
  
    const flattenedOhlcData = formattedOhlcData.flat();
    await insertOhlcBatch({ ohlcData: flattenedOhlcData });
  
    return arrInstruments.map(instrument => instrument.symbol);
  } catch(error) {
    throw error;
  }
}

export const editInstruments = async ({ instruments }) => {
  try {
    if (!instruments || !instruments.length) {
      return [];
    }

    const updates = instruments.map(
      inst => `(${inst.id}, '${inst.symbol}', '${inst.name}', '${inst.category}')`
    ).join(',');

    const query = `
      UPDATE instrument AS i
      SET 
        symbol = c.symbol,
        name = c.name,
        category = c.category
      FROM (VALUES ${updates}) AS c(id, symbol, name, category)
      WHERE i.id = c.id::integer
      RETURNING i.id, i.symbol, i.name, i.category;
    `;

    const result = await sql(query);
    return result;
  } catch (error) {
    throw error;
  }
}

export const removeInstrument = async ({ id }) => {
  try {
    const exists = await sql`SELECT id, symbol FROM instrument WHERE id = ${id}`;
    
    if (!exists.length) {
      return null;
    }
    
    const result = await sql`
      DELETE FROM instrument
      WHERE id = ${id}
      RETURNING id, symbol, name, category
    `;
    
    return result[0];
  } catch (error) {
    throw error;
  }
}

export const fetchSectorStockRelations = async () => {
  try {
    const result = await sql`
      SELECT 
        ss.id,
        ss.id_sector as sector_id,
        sector.symbol as sector_symbol,
        sector.name as sector_name,
        ss.id_stock as stock_id,
        stock.symbol as stock_symbol,
        stock.name as stock_name
      FROM sector_stock ss
      JOIN instrument sector ON ss.id_sector = sector.id
      JOIN instrument stock ON ss.id_stock = stock.id
      ORDER BY sector.symbol, stock.symbol
    `;
    
    return result;
  } catch (error) {
    throw new Error(`Error obteniendo relaciones sector-stock: ${error.message}`);
  }
}

export const insertSectorStockRelations = async ({ relations }) => {
  try {
    if (!relations || !relations.length) {
      throw new Error("No relations data provided");
    }

    // Extraer todos los símbolos únicos para buscarlos en una sola consulta
    const sectorSymbols = [...new Set(relations.map(rel => rel.sector_symbol))];
    const stockSymbols = [...new Set(relations.map(rel => rel.stock_symbol))];
    
    // Buscar los IDs correspondientes en la tabla instrument
    const sectorsResult = await sql`
      SELECT id, symbol
      FROM instrument
      WHERE symbol = ANY(${sectorSymbols})
    `;
    
    const stocksResult = await sql`
      SELECT id, symbol
      FROM instrument
      WHERE symbol = ANY(${stockSymbols})
    `;
    
    // Crear mapas para búsqueda eficiente
    const sectorMap = new Map(sectorsResult.map(s => [s.symbol, s.id]));
    const stockMap = new Map(stocksResult.map(s => [s.symbol, s.id]));
    
    // Validar que todos los símbolos existan
    const missingSymbols = [];
    relations.forEach(rel => {
      if (!sectorMap.has(rel.sector_symbol)) {
        missingSymbols.push(`Sector '${rel.sector_symbol}'`);
      }
      if (!stockMap.has(rel.stock_symbol)) {
        missingSymbols.push(`Stock '${rel.stock_symbol}'`);
      }
    });
    
    if (missingSymbols.length > 0) {
      throw new Error(`The following symbols were not found: ${missingSymbols.join(', ')}`);
    }
    
    // Preparar las relaciones para inserción
    const relationsToInsert = relations.map(rel => ({
      id_sector: sectorMap.get(rel.sector_symbol),
      id_stock: stockMap.get(rel.stock_symbol)
    }));

    // Verificar si las relaciones ya existen
    const addedRelations = [];
    
    for (const relation of relationsToInsert) {
      try {
        // Verificar si la relación ya existe
        const exists = await sql`
          SELECT id FROM sector_stock 
          WHERE id_sector = ${relation.id_sector} AND id_stock = ${relation.id_stock}
        `;
        
        if (exists.length === 0) {
          // Insertar sólo si no existe
          const result = await sql`
            INSERT INTO sector_stock (id_sector, id_stock)
            VALUES (${relation.id_sector}, ${relation.id_stock})
            RETURNING id, id_sector, id_stock
          `;
          
          if (result.length > 0) {
            addedRelations.push(result[0]);
          }
        }
      } catch (err) {
        console.error(`Error inserting relation: ${err.message}`);
      }
    }
    
    return {
      added: addedRelations.length,
      total: relations.length
    };
  } catch (error) {
    throw new Error(`Error adding sector-stock relations: ${error.message}`);
  }
}

export const editSectorStockRelations = async ({ relations }) => {
  try {
    if (!relations || !relations.length) {
      throw new Error("No relations data provided");
    }

    // Extraer todos los símbolos únicos para buscarlos en una sola consulta
    const sectorSymbols = [...new Set(relations.map(rel => rel.sector_symbol))];
    const stockSymbols = [...new Set(relations.map(rel => rel.stock_symbol))];
    
    // Buscar los IDs correspondientes en la tabla instrument
    const sectorsResult = await sql`
      SELECT id, symbol
      FROM instrument
      WHERE symbol = ANY(${sectorSymbols})
    `;
    
    const stocksResult = await sql`
      SELECT id, symbol
      FROM instrument
      WHERE symbol = ANY(${stockSymbols})
    `;
    
    // Crear mapas para búsqueda eficiente
    const sectorMap = new Map(sectorsResult.map(s => [s.symbol, s.id]));
    const stockMap = new Map(stocksResult.map(s => [s.symbol, s.id]));
    
    // Validar que todos los símbolos existan
    const missingSymbols = [];
    relations.forEach(rel => {
      if (!sectorMap.has(rel.sector_symbol)) {
        missingSymbols.push(`Sector '${rel.sector_symbol}'`);
      }
      if (!stockMap.has(rel.stock_symbol)) {
        missingSymbols.push(`Stock '${rel.stock_symbol}'`);
      }
    });
    
    if (missingSymbols.length > 0) {
      throw new Error(`The following symbols were not found: ${missingSymbols.join(', ')}`);
    }
    
    // Actualizar cada relación por su ID
    const results = await Promise.all(
      relations.map(async (rel) => {
        const sectorId = sectorMap.get(rel.sector_symbol);
        const stockId = stockMap.get(rel.stock_symbol);
        
        const result = await sql`
          UPDATE sector_stock
          SET id_sector = ${sectorId}, id_stock = ${stockId}
          WHERE id = ${rel.id}
          RETURNING id, id_sector, id_stock
        `;
        
        return result.length > 0 ? result[0] : null;
      })
    );
    
    // Filtrar resultados null (registros que no se encontraron)
    const updatedRecords = results.filter(Boolean);
    
    return {
      updated: updatedRecords.length,
      total: relations.length,
      records: updatedRecords
    };
  } catch (error) {
    throw new Error(`Error updating sector-stock relations: ${error.message}`);
  }
}

export const removeSectorStockRelation = async ({ id }) => {
  try {
    // Verificar si el registro existe antes de eliminarlo
    const exists = await sql`SELECT id FROM sector_stock WHERE id = ${id}`;
    
    if (!exists.length) {
      return null;
    }
    
    // Eliminar el registro
    const result = await sql`
      DELETE FROM sector_stock
      WHERE id = ${id}
      RETURNING id, id_sector, id_stock
    `;
    
    return result.length > 0 ? result[0] : null;
  } catch (error) {
    throw new Error(`Error eliminando relación sector-stock: ${error.message}`);
  }
}

export const fetchFutureSectorRelations = async () => {
  const result = await sql`
    SELECT 
      fs.id,
      f.symbol AS future_symbol,
      f.name AS future_name,
      s.symbol AS sector_symbol,
      s.name AS sector_name
    FROM future_sector fs
    JOIN instrument f ON fs.id_future = f.id
    JOIN instrument s ON fs.id_sector = s.id
    ORDER BY f.symbol, s.symbol
  `;

  return result;
};

export const insertFutureSectorRelations = async ({ relations }) => {
  try {
    if (!relations || !relations.length) {
      throw new Error("No relations data provided");
    }

    // Extraer todos los símbolos únicos para buscarlos en una sola consulta
    const futureSymbols = [...new Set(relations.map(rel => rel.future_symbol))];
    const sectorSymbols = [...new Set(relations.map(rel => rel.sector_symbol))];
    
    // Buscar los IDs correspondientes en la tabla instrument
    const futuresResult = await sql`
      SELECT id, symbol
      FROM instrument
      WHERE symbol = ANY(${futureSymbols})
    `;
    
    const sectorsResult = await sql`
      SELECT id, symbol
      FROM instrument
      WHERE symbol = ANY(${sectorSymbols})
    `;
    
    // Crear mapas para búsqueda eficiente
    const futureMap = new Map(futuresResult.map(s => [s.symbol, s.id]));
    const sectorMap = new Map(sectorsResult.map(s => [s.symbol, s.id]));
    
    // Validar que todos los símbolos existan
    const missingSymbols = [];
    relations.forEach(rel => {
      if (!futureMap.has(rel.future_symbol)) {
        missingSymbols.push(`Future '${rel.future_symbol}'`);
      }
      if (!sectorMap.has(rel.sector_symbol)) {
        missingSymbols.push(`Sector '${rel.sector_symbol}'`);
      }
    });
    
    if (missingSymbols.length > 0) {
      throw new Error(`The following symbols were not found: ${missingSymbols.join(', ')}`);
    }
    
    // Preparar las relaciones para inserción
    const relationsToInsert = relations.map(rel => ({
      id_future: futureMap.get(rel.future_symbol),
      id_sector: sectorMap.get(rel.sector_symbol)
    }));

    // Verificar si las relaciones ya existen
    const addedRelations = [];
    
    for (const relation of relationsToInsert) {
      try {
        // Verificar si la relación ya existe
        const exists = await sql`
          SELECT id FROM future_sector 
          WHERE id_future = ${relation.id_future} AND id_sector = ${relation.id_sector}
        `;
        
        if (exists.length === 0) {
          // Insertar sólo si no existe
          const result = await sql`
            INSERT INTO future_sector (id_future, id_sector)
            VALUES (${relation.id_future}, ${relation.id_sector})
            RETURNING id, id_future, id_sector
          `;
          
          if (result.length > 0) {
            addedRelations.push(result[0]);
          }
        }
      } catch (err) {
        console.error(`Error inserting relation: ${err.message}`);
      }
    }
    
    return {
      added: addedRelations.length,
      total: relations.length
    };
  } catch (error) {
    throw new Error(`Error adding future-sector relations: ${error.message}`);
  }
}