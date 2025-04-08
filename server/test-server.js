// Script temporaire pour tester l'API
// Ce script lance une version simple du serveur sur le port 4001

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const { PrismaClient } = require('@prisma/client');

// Importer les routes
let routes;
try {
  routes = require('./dist/api/routes').default;
  console.log('Routes chargées avec succès');
} catch (error) {
  console.error('Erreur lors du chargement des routes:', error);
  console.log('Structure des routes:', require('./dist/api/routes'));
  process.exit(1);
}

// Initialiser Express
const app = express();
const PORT = 4001;
const prisma = new PrismaClient();

// Middleware de base
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS configuration - plus permissif pour le développement
app.use(cors({
  origin: true, // Autorise toutes les origines
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: [
    'Content-Type', 
    'Authorization', 
    'X-Requested-With', 
    'X-Client-Platform',
    'X-Client-Version',
    'Accept'
  ]
}));

// Logging middleware pour voir les requêtes
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} [${req.method}] ${req.url}`);
  if (req.method !== 'GET') {
    console.log('Request body:', req.body);
  }
  
  // Intercepter la réponse pour logger
  const originalSend = res.send;
  res.send = function(body) {
    console.log(`Response ${res.statusCode}:`, 
      typeof body === 'string' && body.length < 1000 ? body : '[Response too large to display]');
    originalSend.call(this, body);
  };
  
  next();
});

// Servir les fichiers statiques avec la configuration MIME
app.use(express.static('public', {
  setHeaders: (res, path) => {
    if (path.endsWith('.js')) {
      res.setHeader('Content-Type', 'application/javascript');
    }
  }
}));

// API Routes
app.use("/api", routes);

// Route de test
app.get("/", (req, res) => {
  res.json({ 
    message: "RoadBook Test API is running",
    version: "1.0.0",
    timestamp: new Date().toISOString()
  });
});

// Démarrer le serveur
async function startServer() {
  try {
    // Connecter à la base de données
    await prisma.$connect();
    console.log('Connected to database');

    // Démarrer le serveur
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Test server running on port ${PORT}`);
      console.log(`API URL: http://localhost:${PORT}/api`);
      console.log(`Test UI: http://localhost:${PORT}/`);
    });
  } catch (error) {
    console.error('Server startup failed:', error);
    process.exit(1);
  }
}

// Lancer le serveur
startServer().catch(error => {
  console.error('Failed to start server:', error);
  process.exit(1);
});