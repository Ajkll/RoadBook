const fs = require('fs')
const path = require('path')

const appConfigPath = path.join(__dirname, 'app.config.js')
const packageJson = require('./package.json')

// Lire le fichier comme texte brut
let contents = fs.readFileSync(appConfigPath, 'utf8')

// Mettre à jour la version
contents = contents.replace(
  /(version: ")([0-9.]+)(")/,
  `$1${packageJson.version}$3`
)

// Réécrire le fichier
fs.writeFileSync(appConfigPath, contents)

console.log(`app.config.js mis à jour à la version ${packageJson.version}`)