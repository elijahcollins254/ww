# Welcome to your Expo app 👋

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
   npx expo start
   ```

## Google sign-in

Google sign-in uses an OAuth authorization-code flow with PKCE and returns to the
app through the `ww` URL scheme. Configure a Google OAuth client for each native
platform in the Google Cloud project, then provide these public client IDs to the
Expo app:

- `EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID`
- `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID`
- `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` (web builds)

The legacy `EXPO_PUBLIC_GOOGLE_CLIENT_ID` is used as a fallback. Set the IDs in
the local Expo environment and the EAS build profiles as needed. Do not put
Google client secrets in the app.

The Django API must have `GOOGLE_OAUTH_CLIENT_IDS` configured as a comma-separated
list of the same OAuth client IDs. The Expo app posts the verified Google ID
token to `/users/google-auth/mobile/`; the existing `/users/google-auth/`
endpoint remains unchanged for Next.js.

OAuth redirects require a development build or installed app with the `ww`
scheme; Expo Go does not support this sign-in redirect.

## Pickup maps

Pickup booking and the profile screen support tapping the map or dragging a pin,
and can use the device's current location after permission is granted. Coordinates
are saved with the user profile and sent with each booking. Android and iOS use
`react-native-maps`; the Expo web build uses Google Maps JavaScript. The Next.js
site uses OpenStreetMap tiles and does not need a Google Maps key.

Create separate Google Maps API keys in the Google Cloud project and restrict
each one to its app and API:

- Android: restrict by Android app (`com.kibeezy.ww` and the signing certificate
  SHA-1 fingerprints) and allow **Maps SDK for Android**.
- iOS: restrict by iOS app (`com.kibeezy.ww`) and allow **Maps SDK for iOS**.
- Expo web: restrict by the website HTTP referrers and allow **Maps JavaScript
  API**.

For local development, put these entries in `ww/.env` (do not commit the keys):

```dotenv
GOOGLE_MAPS_ANDROID_API_KEY=your_android_key
GOOGLE_MAPS_IOS_API_KEY=your_ios_key
EXPO_PUBLIC_GOOGLE_MAPS_WEB_API_KEY=your_web_key
```

Set the same environment variables in the EAS build environment for development,
preview, and production builds. Native map keys are added to the generated app
configuration, so rebuild the native app after adding or rotating them; restarting
Metro alone is not enough. In Google Cloud Console, find or create keys under
**Google Maps Platform → Keys & Credentials**. Enable billing and the listed APIs
for the project first.

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.

### Other setup steps

- To set up ESLint for linting, run `npx expo lint`, or follow our guide on ["Using ESLint and Prettier"](https://docs.expo.dev/guides/using-eslint/)
- If you'd like to set up unit testing, follow our guide on ["Unit Testing with Jest"](https://docs.expo.dev/develop/unit-testing/)
- Learn more about the TypeScript setup in this template in our guide on ["Using TypeScript"](https://docs.expo.dev/guides/typescript/)

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.
