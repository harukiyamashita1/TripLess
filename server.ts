import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import { tripService } from './src/services/tripService';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.post('/api/trips/generate', async (req, res) => {
    try {
      const { destination, startDate, endDate, travelers, budgetStyle, pace, tripType, additionalNotes, userId } = req.body;
      const trip = await tripService.createNewTrip(
        destination,
        startDate,
        endDate,
        travelers,
        budgetStyle,
        pace,
        tripType,
        additionalNotes,
        userId
      );
      res.json(trip);
    } catch (error: any) {
      console.error('Error generating trip:', error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/trips/refine', async (req, res) => {
    try {
      const { currentTrip, userRequest, userId } = req.body;
      const result = await tripService.refineTrip(currentTrip, userRequest, userId);
      res.json(result);
    } catch (error: any) {
      console.error('Error refining trip:', error);
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/trips/:id', async (req, res) => {
    try {
      const trip = await tripService.getTrip(req.params.id);
      if (!trip) return res.status(404).json({ error: 'Trip not found' });
      res.json(trip);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/users/:userId/trips', async (req, res) => {
    try {
      const trips = await tripService.listUserTrips(req.params.userId);
      res.json(trips);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
