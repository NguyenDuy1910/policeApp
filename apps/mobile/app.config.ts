import base from './app.json';

export default {
  ...base.expo,
  android: {
    ...base.expo.android,
    config: {
      googleMaps: {
        apiKey: process.env.GOOGLE_MAPS_ANDROID_API_KEY ?? '',
      },
    },
  },
};
