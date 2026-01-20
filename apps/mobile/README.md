# FoulPay Mobile App

React Native/Expo mobile application for FoulPay - team fines management.

## Project Structure

```
apps/mobile/
├── App.tsx                    # Main app entry point
├── src/
│   ├── config/
│   │   └── api.ts            # API configuration and endpoints
│   ├── context/
│   │   └── AuthContext.tsx   # Authentication state management
│   ├── hooks/
│   │   └── useApi.ts         # API hooks using TanStack Query
│   ├── lib/
│   │   └── apiClient.ts      # HTTP client with auth headers
│   ├── navigation/
│   │   └── index.tsx         # React Navigation setup
│   ├── screens/
│   │   ├── auth/
│   │   │   ├── LoginScreen.tsx
│   │   │   └── RegisterScreen.tsx
│   │   ├── player/
│   │   │   ├── DashboardScreen.tsx
│   │   │   └── FinesScreen.tsx
│   │   ├── admin/
│   │   │   ├── AdminDashboardScreen.tsx
│   │   │   └── WalletScreen.tsx
│   │   └── SettingsScreen.tsx
│   └── types/
│       └── index.ts          # TypeScript type definitions
└── package.json
```

## Features

### Player Features
- Dashboard with fine summary and stats
- Fines list with pending/unpaid/paid sections
- Multi-fine selection and payment via GoCardless
- Settings and profile management

### Admin Features  
- Dashboard with team statistics
- Wallet management with balance overview
- Pending payment simulation (success/cancel/fail)
- Clear all pending payments functionality

## Setup Instructions

1. **Install Dependencies**
   ```bash
   cd apps/mobile
   npm install
   ```

2. **Configure API URL**
   Create a `.env` file in `apps/mobile/`:
   ```
   EXPO_PUBLIC_API_URL=https://your-replit-app-url.replit.app
   ```

3. **Start Development**
   ```bash
   npm start
   ```

4. **Run on Device/Simulator**
   - Press `i` for iOS simulator
   - Press `a` for Android emulator
   - Scan QR code with Expo Go app on physical device

## Backend Requirements

The mobile app requires new authentication endpoints on the backend:

- `POST /api/auth/login` - Email/password login returning JWT
- `POST /api/auth/register` - Create account with email/password
- `POST /api/auth/logout` - Invalidate JWT token

These endpoints need to be added to the existing Express backend since the current Replit OIDC authentication doesn't work with native mobile apps.

## Key Dependencies

- **expo** - React Native development framework
- **@react-navigation/native** - Navigation container
- **@react-navigation/bottom-tabs** - Tab navigation
- **@react-navigation/native-stack** - Stack navigation
- **@tanstack/react-query** - Server state management
- **expo-secure-store** - Secure token storage

## Notes

- This is a scaffold for the mobile app structure
- Backend auth endpoints need to be implemented
- The app connects to the same API as the web app
- GoCardless payment flow opens in the device browser
