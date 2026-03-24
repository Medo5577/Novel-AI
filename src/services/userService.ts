import { db, auth } from './firebase';
import { doc, getDoc, setDoc, updateDoc, arrayUnion } from 'firebase/firestore';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export interface UserProfile {
  uid?: string;
  displayName?: string;
  skills: string[];
  preferences: Record<string, any>;
  memories: { id: string; content: string; timestamp: number }[];
}

export const getUserProfile = async (uid: string): Promise<UserProfile> => {
  const userRef = doc(db, 'users', uid);
  try {
    const userDoc = await getDoc(userRef);
    if (userDoc.exists()) {
      const data = userDoc.data();
      return {
        uid: data.uid,
        displayName: data.displayName,
        skills: data.skills || [],
        preferences: data.preferences || {},
        memories: data.memories || []
      };
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, `users/${uid}`);
  }
  return {
    skills: [],
    preferences: {},
    memories: []
  };
};

export const saveUserProfile = async (uid: string, profile: Partial<UserProfile>) => {
  const userRef = doc(db, 'users', uid);
  try {
    await updateDoc(userRef, {
      ...profile,
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `users/${uid}`);
  }
};

export const addMemory = async (uid: string, content: string) => {
  const userRef = doc(db, 'users', uid);
  try {
    const newMemory = {
      id: Date.now().toString(),
      content,
      timestamp: Date.now()
    };
    await updateDoc(userRef, {
      memories: arrayUnion(newMemory),
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `users/${uid}`);
  }
};

export const addSkill = async (uid: string, skill: string) => {
  const userRef = doc(db, 'users', uid);
  try {
    await updateDoc(userRef, {
      skills: arrayUnion(skill),
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `users/${uid}`);
  }
};

export const updatePreference = async (uid: string, key: string, value: any) => {
  const userRef = doc(db, 'users', uid);
  try {
    const userDoc = await getDoc(userRef);
    const preferences = userDoc.exists() ? (userDoc.data().preferences || {}) : {};
    preferences[key] = value;
    await updateDoc(userRef, { 
      preferences,
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `users/${uid}`);
  }
};
