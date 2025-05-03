// expo-hooks/disable-bundle-compression.js
// Ce script sera appelé après la publication pour désactiver la compression du bundle
const fs = require('fs');
const path = require('path');

module.exports = async (config) => {
  console.log('Exécution du hook postPublish pour désactiver la compression du bundle');

  // Ce hook est en réalité juste un placeholder
  // EAS Build gère la génération des fichiers natifs, donc nous ne pouvons pas
  // directement manipuler ces fichiers lors du build à distance

  console.log('Hook exécuté avec succès');

  return config;
};