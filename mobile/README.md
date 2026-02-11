# Cape Town GeoHub Mobile App

React Native mobile application for Cape Town GeoHub with offline capabilities and field data collection.

## Features

- **Offline Maps**: Download map tiles for offline use
- **GPS Tracking**: Real-time location tracking for field work
- **Data Collection**: Forms for citizen reporting and field surveys
- **AR Visualization**: Augmented reality for on-site analysis
- **Push Notifications**: Location-based alerts and updates
- **Photo Upload**: Capture and upload photos with geo-tagging

## Setup

### Prerequisites

- Node.js 18+
- React Native CLI
- Xcode (for iOS)
- Android Studio (for Android)

### Installation

```bash
cd mobile
npm install
```

### iOS Setup

```bash
cd ios
pod install
cd ..
npx react-native run-ios
```

### Android Setup

```bash
npx react-native run-android
```

## Project Structure

```
mobile/
├── src/
│   ├── components/      # Reusable UI components
│   ├── screens/        # Screen components
│   ├── navigation/     # Navigation configuration
│   ├── services/       # API and storage services
│   ├── store/          # State management
│   ├── utils/          # Utility functions
│   └── assets/         # Images, fonts, etc.
├── ios/                # iOS native project
├── android/            # Android native project
├── App.tsx             # Root component
└── package.json
```

## Key Libraries

- `react-native-maps`: Map rendering
- `@react-native-community/geolocation`: GPS tracking
- `react-native-fs`: File system access
- `react-native-camera`: Photo capture
- `@react-native-async-storage/async-storage`: Local storage
- `react-native-vector-icons`: Icon library
- `react-navigation`: Navigation
- `axios`: HTTP client

## Development

### Running in Development

```bash
npm start
```

### Building for Production

#### iOS

```bash
cd ios
xcodebuild -workspace GeoHub.xcworkspace -scheme GeoHub -configuration Release
```

#### Android

```bash
cd android
./gradlew assembleRelease
```

## Features Implementation Status

- [x] Basic app structure
- [ ] Map integration
- [ ] Offline tile download
- [ ] GPS tracking
- [ ] Data collection forms
- [ ] Photo upload
- [ ] Push notifications
- [ ] AR features
- [ ] Sync with backend

## Contributing

See main project CONTRIBUTING.md for guidelines.

## License

See main project LICENSE file.
