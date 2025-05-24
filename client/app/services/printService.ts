import * as Print from 'expo-print';
import { shareAsync } from 'expo-sharing';
import { Alert } from 'react-native';
import { SessionData } from '../types/session.types';

export interface RouteData {
  id?: string | number;
  date: Date;
  startLocation?: string;
  endLocation?: string;
  distance: string | number;
  validator?: string;
  duration?: string | number;
  title?: string;
  weather?: string;
}

// Fonction pour générer le HTML du PDF
const generatePrintHTML = (roads: SessionData[], title: string = 'Rapport de Routes') => {
  const tableRows = roads.map(route => `
    <tr>
      <td>${new Date(route.date).toLocaleDateString('fr-FR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      })}</td>
      <td>${route.startLocation || '/'}</td>
      <td>${route.endLocation || '/'}</td>
      <td>${route.distance} km</td>
      <td>${route.validatorId || 'Moniteur'}</td>
    </tr>
  `).join('');

  const totalDistance = roads.reduce((total, route) => total + parseFloat(String(route.distance) || '0'), 0);
  const totalDuration = roads.reduce((total, route) => total + parseInt(String(route.duration) || '0'), 0);

  return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>${title}</title>
        <style>
            body {
                font-family: Arial, sans-serif;
                margin: 20px;
                background-color: #fff;
            }
            .header {
                text-align: center;
                margin-bottom: 30px;
                border-bottom: 2px solid #333;
                padding-bottom: 15px;
            }
            .header h1 {
                margin: 0;
                color: #333;
                font-size: 24px;
            }
            .header p {
                margin: 5px 0 0 0;
                color: #666;
                font-size: 14px;
            }
            table {
                width: 100%;
                border-collapse: collapse;
                margin-top: 20px;
                font-size: 12px;
            }
            th, td {
                border: 1px solid #ddd;
                padding: 12px 8px;
                text-align: left;
            }
            th {
                background-color: #f8f9fa;
                font-weight: bold;
                color: #333;
                text-align: center;
            }
            tr:nth-child(even) {
                background-color: #f9f9f9;
            }
            tr:hover {
                background-color: #f5f5f5;
            }
            .footer {
                margin-top: 30px;
                text-align: center;
                font-size: 10px;
                color: #666;
                border-top: 1px solid #ddd;
                padding-top: 15px;
            }
            .summary {
                margin-top: 20px;
                padding: 15px;
                background-color: #f8f9fa;
                border-left: 4px solid #007bff;
            }
            .summary h3 {
                margin: 0 0 10px 0;
                color: #333;
            }
            .summary p {
                margin: 5px 0;
                font-size: 12px;
            }
        </style>
    </head>
    <body>
        <div class="header">
            <h1>${title}</h1>
            <p>Généré le ${new Date().toLocaleDateString('fr-FR', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}</p>
        </div>
        
        <table>
            <thead>
                <tr>
                    <th>Date</th>
                    <th>Lieu de départ</th>
                    <th>Lieu d'arrivée</th>
                    <th>Distance</th>
                    <th>Validateur</th>
                </tr>
            </thead>
            <tbody>
                ${tableRows}
            </tbody>
        </table>
        
        <div class="summary">
            <h3>Résumé</h3>
            <p><strong>Nombre total de routes :</strong> ${roads.length}</p>
            <p><strong>Distance totale :</strong> ${totalDistance.toFixed(1)} km</p>
            <p><strong>Durée totale :</strong> ${totalDuration} min</p>
        </div>
        
        <div class="footer">
            <p>Document généré automatiquement par l'application RoadBook Tracker</p>
        </div>
    </body>
    </html>
  `;
};

// Fonction principale pour imprimer les routes
export const printRoutes = async (
  roads: SessionData[], 
  options: {
    title?: string;
    dialogTitle?: string;
  } = {}
) => {
  try {
    // Vérification si des données existent
    if (!roads || roads.length === 0) {
      Alert.alert('Aucune donnée', 'Il n\'y a aucune route à imprimer.');
      return false;
    }

    const { 
      title = 'Rapport de Routes',
      dialogTitle = 'Partager le rapport de routes'
    } = options;

    // Génération du HTML
    const html = generatePrintHTML(roads, title);
    
    // Création du PDF
    const { uri } = await Print.printToFileAsync({
      html,
      base64: false,
    });

    // Partage du PDF
    await shareAsync(uri, { 
      UTI: '.pdf', 
      mimeType: 'application/pdf',
      dialogTitle
    });

    return true;
  } catch (error) {
    console.error('Erreur lors de l\'impression:', error);
    Alert.alert('Erreur', 'Une erreur est survenue lors de la génération du PDF.');
    return false;
  }
};

// Fonction pour imprimer toutes les routes
export const printAllRoutes = async (roads: SessionData[]) => {
  return printRoutes(roads, {
    title: 'Rapport de toutes les routes',
    dialogTitle: 'Partager le rapport complet'
  });
};

// Fonction pour imprimer une route individuelle
export const printSingleRoute = async (route: SessionData) => {
  return printRoutes([route], {
    title: 'Détail de la route',
    dialogTitle: 'Partager la route'
  });
};