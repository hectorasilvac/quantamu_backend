import express from 'express'
import dotenv from 'dotenv'
import cors from 'cors';

import { initializeDB } from './config/database.js';
import dataRoutes from './routes/data.route.js';
import dbRoutes from './routes/db.route.js';
import screenerRoutes from './routes/screener.route.js';
import sectorRoutes from './routes/sector.route.js';
import usersRoutes from './routes/users.route.js';
import instrumentRoutes from "./routes/instrument.route.js";
import sectorStockRoutes from './routes/sectorStock.route.js';
import futureSectorRoutes from './routes/futureSector.route.js';

dotenv.config()

const app = express();
app.use(cors());
app.use(express.json());

// TODO: Ajustar para que se vea diferente
app.get("/", (req, res) => {
  res.send("¡Hola, este es mi backend en Vercel! 🚀");
});

app.use('/data', dataRoutes);
app.use('/db', dbRoutes);
app.use('/futuresector', futureSectorRoutes);
app.use('/instrument', instrumentRoutes);
app.use('/screener', screenerRoutes);
app.use('/sector', sectorRoutes);
app.use('/sectorstock', sectorStockRoutes);
app.use('/users', usersRoutes);


initializeDB().then(() => {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Server initialized successfully on port ${PORT}`);
  });
});

export default app;
