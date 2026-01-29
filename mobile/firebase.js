// mobile/firebase.ts
// ✅ React Native Firebase - config is auto-loaded from google-services.json

import { firebase } from '@react-native-firebase/app';
import auth from '@react-native-firebase/auth';

// Export auth for direct use
export { auth };

// Export firebase app
export default firebase;