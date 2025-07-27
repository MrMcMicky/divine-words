import express from 'express';
import axios from 'axios';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = 8016;

// Enable CORS for all origins
app.use(cors());
app.use(express.json());

// API proxy endpoint
app.get('/api/bible/:reference', async (req, res) => {
  try {
    const { reference } = req.params;
    const { translation } = req.query;
    
    // Make request to bible-api.com
    const response = await axios.get(`https://bible-api.com/${reference}`, {
      params: { translation },
      timeout: 10000 // 10 second timeout
    });
    
    res.json(response.data);
  } catch (error) {
    console.error('Bible API Error:', error.message);
    
    // Return appropriate error response
    if (error.code === 'ECONNABORTED') {
      res.status(504).json({ error: 'API timeout' });
    } else if (error.response) {
      res.status(error.response.status).json({ 
        error: error.response.data?.error || 'API error' 
      });
    } else {
      res.status(500).json({ error: 'Server error' });
    }
  }
});

// Serve static files from dist directory
app.use(express.static(join(__dirname, 'dist')));

// Handle all other routes (SPA)
app.get('*', (req, res) => {
  res.sendFile(join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Divine Words server running on port ${PORT}`);
});