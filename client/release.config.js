module.exports = {
  header: '# Changelog\n\n',
  types: [
    { type: 'feat', section: 'Features' },
    { type: 'fix', section: 'Fixes' },
    { type: 'test', section: 'Tests' }
  ],
  commitUrlFormat: 'https://github.com/Yanstart/RoadBook/commit/{{hash}}',
  compareUrlFormat: 'https://github.com/Yanstart/RoadBook/compare/{{previousTag}}...{{currentTag}}'
};