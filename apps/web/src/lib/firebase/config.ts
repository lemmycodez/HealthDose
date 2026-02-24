import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: 'AIzaSyB9PJN3xrELTruughZ29tEn4menK0b8xHA',
  authDomain: 'med-assist-9edf0.firebaseapp.com',
  projectId: 'med-assist-9edf0',
  storageBucket: 'med-assist-9edf0.firebasestorage.app',
  messagingSenderId: '1059382249720',
  appId: '1:1059382249720:web:e898b95f637c103f22d30d',
}

// Initialize Firebase
export const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const db = getFirestore(app)
export const firebaseProjectId = firebaseConfig.projectId
