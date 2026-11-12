module.exports = ({ config }) => {
  const mapsOptions = {};
  if (process.env.GOOGLE_MAPS_ANDROID_API_KEY) {
    mapsOptions.androidGoogleMapsApiKey = process.env.GOOGLE_MAPS_ANDROID_API_KEY;
  }
  if (process.env.GOOGLE_MAPS_IOS_API_KEY) {
    mapsOptions.iosGoogleMapsApiKey = process.env.GOOGLE_MAPS_IOS_API_KEY;
  }

  return {
    ...config,
    plugins: [
      ...(config.plugins ?? []),
      ['react-native-maps', mapsOptions],
      ['expo-location', {
        locationWhenInUsePermission: 'Allow Wild Wash to use your location to set a pickup point.',
      }],
    ],
  };
};
