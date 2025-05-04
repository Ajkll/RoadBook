const fs = require('fs')

module.exports.readVersion = function (contents) {
  // Extrait la version du contenu JS
  const match = contents.match(/version: "([0-9.]+)"/)
  return match ? match[1] : null
}

module.exports.writeVersion = function (contents, version) {
  // Remplace la version dans le contenu JS
  return contents.replace(
    /(version: ")([0-9.]+)(")/,
    `$1${version}$3`
  )
}