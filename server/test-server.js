/**
 * Serveur de test pour l'API RoadBook
 * =================================
 * 
 * Ce script lance une version de développement du serveur API
 * avec une interface de test HTML pour interagir facilement avec l'API.
 * 
 * Fonctionnalités:
 * - Sert l'interface de test API depuis le dossier public/
 * - Configure CORS pour accepter les requêtes de toutes les origines
 * - Log détaillé des requêtes et réponses pour le debugging
 */

// Imports nécessaires
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const { PrismaClient } = require('@prisma/client');
const path = require('path');
const fs = require('fs');

// Configuration
const PORT = process.env.TEST_PORT || 4001;
const prisma = new PrismaClient();
let appStartTime = new Date();

// Variables globales pour le statut
const serverStats = {
  requestCount: 0,
  errors: 0,
  startTime: appStartTime,
  routes: []
};

// Couleurs pour les logs en console
const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  dim: "\x1b[2m",
  underscore: "\x1b[4m",
  
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
  white: "\x1b[37m",
};

// Fonctions d'aide pour les logs
function logInfo(message) {
  console.log(`${colors.blue}${colors.bright}ℹ${colors.reset} ${message}`);
}

function logSuccess(message) {
  console.log(`${colors.green}${colors.bright}✓${colors.reset} ${message}`);
}

function logWarning(message) {
  console.log(`${colors.yellow}${colors.bright}⚠${colors.reset} ${message}`);
}

function logError(message) {
  console.log(`${colors.red}${colors.bright}✗${colors.reset} ${message}`);
}

console.log('\n' + '='.repeat(80));
logInfo('Démarrage du serveur de test API...');

// Importer les routes
let routes;
try {
  routes = require('./dist/api/routes').default;
  logSuccess('Routes chargées avec succès');
  
  // Analyser les routes disponibles pour aider l'interface de test
  try {
    const routeModules = fs.readdirSync(path.join(__dirname, 'dist/api/routes'))
      .filter(file => file.endsWith('.js') && !file.startsWith('index'));
    
    logInfo(`Modules de routes disponibles: ${routeModules.join(', ')}`);
    
    // Stocker les routes pour l'API
    serverStats.routes = routeModules.map(file => file.replace('.js', ''));
  } catch (e) {
    logWarning(`Impossible d'analyser les modules de routes: ${e.message}`);
  }
} catch (error) {
  logError('Erreur lors du chargement des routes:');
  console.error(error);
  
  try {
    console.log('Structure actuelle:', require('./dist/api/routes'));
  } catch (e) {
    logError('Impossible d\'accéder aux routes. Avez-vous compilé le projet?');
    logInfo('Exécutez "npm run build" ou "npm run build:fast" avant de lancer le serveur de test.');
  }
  process.exit(1);
}

// Initialiser Express
const app = express();

// Middleware de base
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS configuration - permissif pour l'interface de test
app.use(cors({
  origin: function(origin, callback) {
    // Autoriser toutes les origines en développement
    callback(null, true);
  },
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

// Afficher l'info de debug
logInfo(`Environnement: ${process.env.NODE_ENV || 'development'}`);
logInfo(`URL de base de données: ${process.env.DATABASE_URL?.replace(/:[^:@]+@/, ':***@') || '(non définie)'}`);

// Logging middleware pour voir les requêtes
app.use((req, res, next) => {
  serverStats.requestCount++;
  const requestId = serverStats.requestCount;
  const timestamp = new Date().toISOString();
  
  console.log(`\n${colors.dim}${timestamp}${colors.reset} [${requestId}] ${colors.blue}${req.method}${colors.reset} ${req.url}`);
  
  if (req.method !== 'GET' && Object.keys(req.body).length) {
    console.log(`${colors.cyan}📦 Request body:${colors.reset}`, JSON.stringify(req.body, null, 2));
  }
  
  // Intercepter la réponse pour logger
  const originalSend = res.send;
  res.send = function(body) {
    const responseTime = new Date() - req._startTime;
    
    // Formatter le statut avec couleur
    let statusColor = colors.green;
    let statusPrefix = '✓';
    
    if (res.statusCode >= 400) {
      statusColor = colors.red;
      statusPrefix = '✗';
      serverStats.errors++;
    } else if (res.statusCode >= 300) {
      statusColor = colors.yellow;
      statusPrefix = '➤';
    }
    
    console.log(`${colors.dim}${timestamp}${colors.reset} [${requestId}] ${statusColor}${statusPrefix} ${res.statusCode}${colors.reset} (${responseTime}ms)`);
    
    // Afficher le corps de la réponse si pas trop grand
    try {
      let logBody = body;
      if (typeof body === 'string') {
        try {
          // Essayer de parser en JSON pour un affichage plus propre
          logBody = JSON.parse(body);
        } catch (e) {
          // Si pas du JSON, utiliser tel quel
          if (body.length > 500) {
            logBody = body.substring(0, 500) + '... [tronqué]';
          }
        }
      }
      
      if (logBody && typeof logBody === 'object') {
        console.log(`${colors.cyan}📦 Response:${colors.reset}`, JSON.stringify(logBody, null, 2));
      } else if (logBody) {
        console.log(`${colors.cyan}📦 Response:${colors.reset}`, logBody);
      }
    } catch (e) {
      console.log(`${colors.yellow}⚠ Impossible d'afficher la réponse:${colors.reset}`, e.message);
    }
    
    return originalSend.call(this, body);
  };
  
  // Marquer le temps de début pour calculer la durée
  req._startTime = new Date();
  next();
});

// Middleware pour remplacer les marqueurs dans l'index.html
app.get('/', (req, res) => {
  try {
    // Lire le fichier index.html
    const htmlPath = path.join(__dirname, 'public', 'index.html');
    let html = fs.readFileSync(htmlPath, 'utf8');
    
    // Injecter des informations sur les routes disponibles
    const routeList = serverStats.routes.map(route => `/api/${route}`);
    
    // Remplacer le marqueur dans le HTML
    html = html.replace('<!-- ROUTE_LIST -->', JSON.stringify(routeList));
    
    // Envoyer avec le bon Content-Type
    res.setHeader('Content-Type', 'text/html');
    res.send(html);
  } catch (error) {
    console.error('Erreur lors de la lecture du fichier index.html:', error);
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
  }
});

// Servir les fichiers statiques (interface de test)
app.use(express.static('public', {
  setHeaders: (res, path) => {
    if (path.endsWith('.js')) {
      res.setHeader('Content-Type', 'application/javascript');
    } else if (path.endsWith('.css')) {
      res.setHeader('Content-Type', 'text/css');
    }
  }
}));

// API Routes - La partie importante !
app.use("/api", routes);

// Informations sur le serveur
app.get("/api/system/info", (req, res) => {
  const uptime = Math.floor((new Date() - serverStats.startTime) / 1000);
  
  res.json({ 
    status: "success",
    message: "RoadBook Test API is running",
    version: require('./package.json').version || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    startTime: serverStats.startTime,
    uptime,
    uptimeFormatted: formatUptime(uptime),
    stats: {
      requestCount: serverStats.requestCount,
      errorCount: serverStats.errors,
    },
    availableRoutes: serverStats.routes.map(route => `/api/${route}`)
  });
});

// Formatting uptime helper
function formatUptime(seconds) {
  const days = Math.floor(seconds / 86400);
  seconds %= 86400;
  const hours = Math.floor(seconds / 3600);
  seconds %= 3600;
  const minutes = Math.floor(seconds / 60);
  seconds %= 60;
  
  let uptime = '';
  if (days > 0) uptime += `${days}d `;
  if (hours > 0 || days > 0) uptime += `${hours}h `;
  if (minutes > 0 || hours > 0 || days > 0) uptime += `${minutes}m `;
  uptime += `${seconds}s`;
  
  return uptime;
}

// Gérer les routes non trouvées
app.use((req, res) => {
  logWarning(`Route non trouvée: ${req.method} ${req.url}`);
  res.status(404).json({
    status: 'error',
    message: 'Route not found',
    path: req.url
  });
});

// Gestionnaire d'erreurs global
app.use((err, req, res, next) => {
  logError(`Erreur de serveur: ${err.message}`);
  console.error(err.stack);
  
  res.status(err.status || 500).json({
    status: 'error',
    message: err.message || 'Une erreur interne est survenue',
    error: process.env.NODE_ENV === 'development' ? err : {}
  });
});

// Démarrer le serveur
async function startServer() {
  try {
    // Connecter à la base de données
    await prisma.$connect();
    logSuccess('Connecté à la base de données');

    // Démarrer le serveur
    app.listen(PORT, "0.0.0.0", () => {
      console.log('\n' + '-'.repeat(80));
      logSuccess(`Serveur de test démarré sur le port ${PORT}`);
      console.log('\n' + '-'.repeat(30) + ' URLS ' + '-'.repeat(30));
      logInfo(`API URL: http://localhost:${PORT}/api`);
      logInfo(`Interface de test: http://localhost:${PORT}/`);
      logInfo(`Statut du serveur: http://localhost:${PORT}/api/system/info`);
      console.log('-'.repeat(80) + '\n');
    });
  } catch (error) {
    logError('Échec du démarrage du serveur:');
    console.error(error);
    process.exit(1);
  }
}

// Gérer l'arrêt propre
process.on('SIGINT', async () => {
  logInfo('Arrêt du serveur de test...');
  await prisma.$disconnect();
  logSuccess('Déconnecté de la base de données');
  console.log('='.repeat(80) + '\n');
  process.exit(0);
});

process.on('SIGTERM', async () => {
  logInfo('Arrêt du serveur de test...');
  await prisma.$disconnect();
  logSuccess('Déconnecté de la base de données');
  console.log('='.repeat(80) + '\n');
  process.exit(0);
});

// Lancer le serveur
startServer().catch(error => {
  logError('Échec du démarrage du serveur:');
  console.error(error);
  process.exit(1);
});