import { db, auth } from './firebase';
import { 
  collection, 
  addDoc, 
  query, 
  where, 
  getDocs, 
  orderBy, 
  doc, 
  updateDoc, 
  deleteDoc,
  Timestamp,
  serverTimestamp
} from 'firebase/firestore';
import { Message } from './geminiService';

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

export interface ChatSession {
  id: string;
  userId: string;
  title: string;
  messages: Message[];
  updatedAt: any;
}

export const saveChat = async (userId: string, messages: Message[], chatId?: string, title?: string): Promise<string> => {
  if (chatId) {
    const chatRef = doc(db, 'chats', chatId);
    try {
      await updateDoc(chatRef, {
        messages,
        updatedAt: serverTimestamp(),
        title: title || messages[0]?.parts[0].text?.slice(0, 30) || 'Untitled Chat'
      });
      return chatId;
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `chats/${chatId}`);
      return chatId;
    }
  } else {
    const chatRef = collection(db, 'chats');
    try {
      const newChat = await addDoc(chatRef, {
        userId,
        messages,
        title: title || messages[0]?.parts[0].text?.slice(0, 30) || 'Untitled Chat',
        updatedAt: serverTimestamp(),
        createdAt: serverTimestamp()
      });
      return newChat.id;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'chats');
      return '';
    }
  }
};

export const getUserChats = async (userId: string): Promise<ChatSession[]> => {
  const chatRef = collection(db, 'chats');
  const q = query(
    chatRef, 
    where('userId', '==', userId), 
    orderBy('updatedAt', 'desc')
  );
  try {
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as ChatSession));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'chats');
    return [];
  }
};

export const deleteChat = async (chatId: string) => {
  const chatRef = doc(db, 'chats', chatId);
  try {
    await deleteDoc(chatRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `chats/${chatId}`);
  }
};
