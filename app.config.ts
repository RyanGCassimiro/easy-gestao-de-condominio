import { ExpoConfig, ConfigContext } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'Easy Gestão de Condomínio',
  slug: 'easy-gestao-de-condominio',
  version: '1.0.0',
  orientation: 'portrait',
  scheme: 'easy-core',
  userInterfaceStyle: 'automatic',
  ios: {
    supportsTablet: true,
    bundleIdentifier: 'com.easycore.gestaocondominio',
  },
  android: {
    adaptiveIcon: {
      backgroundColor: '#FAF7F4',
    },
    package: 'com.easycore.gestaocondominio',
  },
  web: {
    bundler: 'metro',
    output: 'static',
  },
  plugins: [
    'expo-router',
    'expo-secure-store',
    'expo-image-picker',
    [
      'expo-notifications',
      {
        color: '#8B4513',
      },
    ],
  ],
  experiments: {
    typedRoutes: true,
  },
});
