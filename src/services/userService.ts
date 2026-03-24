import { db, auth } from './firebase';
import { doc, getDoc, setDoc, updateDoc, arrayUnion } from 'firebase/firestore';

export interface UserProfile {
  uid?: string;
  name?: string;
  skills: string[];
  preferences: Record<string, any>;
  memories: { id: string; content: string; timestamp: number }[];
}

export const getUserProfile = async (uid: string): Promise<UserProfile> => {
  try {
    const userRef = doc(db, 'users', uid);
    const userDoc = await getDoc(userRef);
    if (userDoc.exists()) {
      const data = userDoc.data();
      return {
        uid: data.uid,
        name: data.displayName,
        skills: data.skills || [],
        preferences: data.preferences || {},
        memories: data.memories || []
      };
    }
  } catch (error) {
    console.error("Error fetching user profile:", error);
  }
  return {
    skills: [],
    preferences: {},
    memories: []
  };
};

export const saveUserProfile = async (uid: string, profile: Partial<UserProfile>) => {
  try {
    const userRef = doc(db, 'users', uid);
    await updateDoc(userRef, {
      ...profile,
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error("Error saving user profile:", error);
  }
};

export const addMemory = async (uid: string, content: string) => {
  try {
    const userRef = doc(db, 'users', uid);
    const newMemory = {
      id: Date.now().toString(),
      content,
      timestamp: Date.now()
    };
    await updateDoc(userRef, {
      memories: arrayUnion(newMemory)
    });
  } catch (error) {
    console.error("Error adding memory:", error);
  }
};

export const addSkill = async (uid: string, skill: string) => {
  try {
    const userRef = doc(db, 'users', uid);
    await updateDoc(userRef, {
      skills: arrayUnion(skill)
    });
  } catch (error) {
    console.error("Error adding skill:", error);
  }
};

export const updatePreference = async (uid: string, key: string, value: any) => {
  try {
    const userRef = doc(db, 'users', uid);
    const userDoc = await getDoc(userRef);
    const preferences = userDoc.exists() ? (userDoc.data().preferences || {}) : {};
    preferences[key] = value;
    await updateDoc(userRef, { preferences });
  } catch (error) {
    console.error("Error updating preference:", error);
  }
};
