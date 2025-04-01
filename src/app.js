import express from 'express'
import dotenv from 'dotenv'
import cors from 'cors';

import { initializeDB } from './config/database.js';
import dataRoutes from './routes/data.route.js';
import dbRoutes from './routes/db.route.js';
import screenerRoutes from './routes/screener.route.js';
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
app.use('/screener', screenerRoutes);

initializeDB().then(() => {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Server initialized successfully on port ${PORT}`);
  });
});

export default app;
