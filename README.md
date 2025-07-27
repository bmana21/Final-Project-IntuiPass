# Visual Password Manager

A Chrome extension that revolutionizes password creation and management through intuitive visual patterns. Create secure passwords using dots, chess configurations, pixel art, mathematical expressions, and piano melodies.

## Features

### Visual Password Creation Methods
- **Connect the Dots**: Create passwords by connecting dots in unique patterns
- **Chess Configuration**: Set up chess pieces on a board to generate secure passwords
- **Pixel Art**: Draw patterns on a pixel grid that convert to strong passwords
- **Math Expression**: Write mathematical expressions that are converted to real passwords using AI
- **Piano**: Create melodies on a virtual piano keyboard for musical password generation

### Core Functionality
- **Google Account Integration**: Secure sign-in and synchronization across devices
- **Auto-Fill**: Automatic password insertion during login and account creation
- **Password Management**: View, edit, and organize all your visual passwords
- **Mobile Sharing**: Generate QR codes to share passwords with your mobile devices
- **Cross-Device Sync**: Access your passwords from any device with your Google account

## Technology Stack

- **TypeScript**: Type-safe development and enhanced code reliability
- **React**: Modern UI framework for responsive user interface
- **Chrome Extension APIs**: Native browser integration
- **Firebase**: Backend services for authentication and data storage
- **Google Cloud APIs**: AI-powered math expression conversion

## Installation

### Prerequisites
- Node.js (version 16 or higher)
- npm or yarn package manager
- Google Chrome browser
- Firebase project setup
- Google Cloud Console project

### Development Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/bmana21/Final-Project-IntuiPass.git
   cd Final-Project-IntuiPass/app
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Build the extension**
   ```bash
   npm run build
   ```

4. **Load the extension in Chrome**
    - Open Chrome and navigate to `chrome://extensions/`
    - Enable "Developer mode" in the top right corner
    - Click "Load unpacked" button
    - Select the `build` or `dist` folder from your project directory

### Firebase Configuration

1. **Create a Firebase project**
    - Go to [Firebase Console](https://console.firebase.google.com/)
    - Create a new project or use an existing one
    - Enable Authentication with Google provider
    - Enable Firestore Database

2. **Get Firebase configuration**
    - Navigate to Project Settings > General
    - Scroll down to "Your apps" section
    - Click on the web app icon to create a web app
    - Copy the configuration object

3. **Add configuration to your project**
    - Navigate to `src/firebase/firebase-config.ts`
    - Replace the configuration object with your Firebase settings:
   ```typescript
   const firebaseConfig = {
     apiKey: "your_api_key",
     authDomain: "your_project.firebaseapp.com",
     projectId: "your_project_id",
     storageBucket: "your_project.firebasestorage.app",
     messagingSenderId: "your_sender_id",
     appId: "your_app_id",
     measurementId: "your_measurement_id"
   };
   ```

### Google Cloud Console Setup

#### Google API Key Setup (Chrome OAuth Client)
To allow Google sign-in inside your extension:

1. **Go to Google Cloud Console**
    - Create a new project (or select existing)
    - Enable the **OAuth 2.0 API**
    - Navigate to **APIs & Services → Credentials**
    - Create an **OAuth client ID**:
        - **Application type**: Chrome App
        - **Chrome Extension ID**: Get this from `chrome://extensions/` after loading unpacked

2. **Add the Generated Client ID to Your Firebase Auth**
   In Firebase Console:
    - Go to **Authentication → Sign-in Method → Google**
    - Add the created **OAuth client ID** under **Authorized domains** and **Web client IDs**

3. **Enable required APIs**
    - Navigate to "APIs & Services" > "Library"
    - Enable the following APIs:
        - Cloud Natural Language API (for math expression processing)
        - Firebase Authentication API
        - Cloud Firestore API

4. **Add OAuth Client ID to manifest.json**
   Add the generated OAuth client ID to your `manifest.json` file:
   ```json
   "oauth2": {
     "client_id": "YOUR_GENERATED_CLIENT_ID.apps.googleusercontent.com",
     "scopes": [
       "openid",
       "email",
       "profile"
     ]
   }
   ```

5. **Configure API Key (if needed for other services)**
    - Go to "APIs & Services" > "Credentials"
    - Click "Create Credentials" > "API Key"
    - Configure restrictions as needed for additional API services

### Getting Your Extension ID

1. After loading the unpacked extension in Chrome
2. Go to `chrome://extensions/`
3. Find your extension and copy the ID (long string of letters)
4. Use this ID in your Google Cloud Console API key restrictions

## Usage

### Creating Visual Passwords

1. **Install and activate the extension**
2. **Sign in with your Google account**
3. **Choose your preferred visual method**:
    - Dots: Connect points in a unique pattern
    - Chess: Arrange pieces on the board
    - Pixel Art: Draw your secret pattern
    - Math: Write expressions (e.g., "2+2*3")
    - Piano: Play a melody sequence

4. **Save your visual password** with a memorable name
5. **The extension automatically converts** your visual pattern into a secure password

### Using Passwords

- **Auto-fill**: The extension detects password fields and offers to fill them
- **Manual selection**: Click the extension icon to choose from saved passwords
- **Mobile sharing**: Generate QR codes to transfer passwords to mobile devices

### Managing Passwords

- **View all passwords**: Access your visual password library
- **Edit patterns**: Modify existing visual passwords
- **Delete passwords**: Remove unused password entries
- **Sync across devices**: All passwords sync with your Google account

## Security

- All visual patterns are processed locally before encryption
- Passwords are encrypted before storage in Firebase
- Google Authentication ensures secure access
- No visual patterns are stored in plain text
- API keys are restricted to your specific extension

## Development

### Available Scripts

- `npm run dev`: Start development server with hot reload
- `npm run build`: Build the extension for production
- `npm run test`: Run test suite
- `npm run lint`: Check code quality and formatting

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## Support

For issues, questions, or feature requests, please create an issue in the repository or contact the development team.

## License

This project is licensed under the MIT License - see the LICENSE file for details.