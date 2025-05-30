const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = 3000;

// Enable CORS for all routes
app.use(cors());

// Serve static files from the current directory
app.use(express.static(__dirname));

// API endpoint to get site configuration and articles
app.get('/api/site', (req, res) => {
  try {
    const indexPath = path.join(__dirname, 'articles', 'index.json');
    
    if (!fs.existsSync(indexPath)) {
      return res.status(404).json({ error: 'Site configuration not found' });
    }
    
    const siteConfig = JSON.parse(fs.readFileSync(indexPath, 'utf8'));
    res.json(siteConfig);
  } catch (error) {
    console.error('Error reading site configuration:', error);
    res.status(500).json({ error: 'Failed to read site configuration' });
  }
});

// API endpoint to get a list of all articles
app.get('/api/articles', (req, res) => {
  try {
    const indexPath = path.join(__dirname, 'articles', 'index.json');
    
    if (!fs.existsSync(indexPath)) {
      return res.status(404).json({ error: 'Articles index not found' });
    }
    
    const siteConfig = JSON.parse(fs.readFileSync(indexPath, 'utf8'));
    res.json(siteConfig.articles);
  } catch (error) {
    console.error('Error reading articles:', error);
    res.status(500).json({ error: 'Failed to read articles' });
  }
});

// API endpoint to get a specific article by filename
app.get('/api/articles/:filename', (req, res) => {
  try {
    const filename = req.params.filename;
    const filePath = path.join(__dirname, 'articles', filename);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Article not found' });
    }
    
    const content = fs.readFileSync(filePath, 'utf8');
    res.send(content);
  } catch (error) {
    console.error('Error reading article:', error);
    res.status(500).json({ error: 'Failed to read article' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
