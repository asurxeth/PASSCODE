
import { getAuth, onAuthStateChanged, type User } from 'firebase/auth';
import { getFirestore, collection, doc, onSnapshot, query, where, orderBy, getDocs, setDoc, deleteDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { app, isConfigValid } from './config';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';

const auth = isConfigValid ? getAuth(app) : null;
const db = isConfigValid ? getFirestore(app) : null;
const storage = isConfigValid ? getStorage(app) : null;

export { 
    auth, 
    onAuthStateChanged,
    db,
    collection,
    doc,
    onSnapshot,
    query,
    where,
    orderBy,
    getDocs,
    setDoc,
    deleteDoc,
    getDoc,
    serverTimestamp,
    storage,
    ref,
    uploadBytes,
    getDownloadURL,
    isConfigValid
};
export type { User };
