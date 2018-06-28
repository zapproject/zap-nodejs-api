const path = require("path");
require('fs').readdirSync(path.join(__dirname,'/contracts')).forEach(function (file) {
  /* If its the current file ignore it */
  if (file === 'index.js') return;

  /* Store module with its name (from filename) */
  module.exports[path.basename(file, '.json')] = require(path.join(__dirname,'/contracts/', file));
});
