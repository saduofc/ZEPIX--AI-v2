// lib/index.js - Auto load all .js files in lib/ (except index.js)
const fs = require('fs');
const path = require('path');

const plugins = {};

function loadPlugins() {
  const pluginDir = __dirname;
  const files = fs.readdirSync(pluginDir).filter(file => 
    file.endsWith('.js') && file !== 'index.js'
  );

  files.forEach(file => {
    const pluginName = path.basename(file, '.js').toLowerCase();
    try {
      const plugin = require(path.join(pluginDir, file));
      plugins[pluginName] = plugin;
      console.log(`Plugin loaded: ${pluginName}`);
    } catch (err) {
      console.error(`Failed to load plugin ${file}:`, err.message);
    }
  });
}

loadPlugins();

module.exports = plugins;
