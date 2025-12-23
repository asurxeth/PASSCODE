
import { getAuth, onAuthStateChanged, type User } from 'firebase/auth';
import { getFirestore, collection, doc, onSnapshot, query, where, orderBy, getDocs, setDoc, deleteDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { app } from './config';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';

const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

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
    getDownloadURL
};
export type { User };
