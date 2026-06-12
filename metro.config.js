const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// @supabase/supabase-js tenta importar @opentelemetry/api opcionalmente.
// Metro não suporta dynamic imports opcionais, então fazemos stub do módulo.
config.resolver.extraNodeModules = {
  ...config.resolver.extraNodeModules,
  '@opentelemetry/api': require.resolve('./src/utils/emptyModule.js'),
};

module.exports = config;
