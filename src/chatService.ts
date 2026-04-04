import { db, auth, storage } from './firebase';
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
import { ref, uploadString, getDownloadURL } from 'firebase/storage';
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

const uploadBase64ToStorage = async (userId: string, base64Data: string, mimeType: string): Promise<string> => {
  const fileId = Date.now().toString() + Math.random().toString(36).substring(7);
  const storageRef = ref(storage, `users/${userId}/attachments/${fileId}`);
  await uploadString(storageRef, base64Data, 'base64', { contentType: mimeType });
  return await getDownloadURL(storageRef);
};

export interface ChatSession {
  id: string;
  userId: string;
  title: string;
  summary?: string;
  messages: Message[];
  updatedAt: any;
}

export const saveChat = async (userId: string, messages: Message[], chatId?: string, title?: string, summary?: string): Promise<string> => {
  // Process messages to upload large base64 data to Storage
  const processedMessages = await Promise.all(messages.map(async (msg) => {
    const processedParts = await Promise.all(msg.parts.map(async (part) => {
      // If it has inlineData and it's large (> 100KB), upload to storage
      if (part.inlineData && part.inlineData.data.length > 100000) {
        try {
          const fileUrl = await uploadBase64ToStorage(userId, part.inlineData.data, part.inlineData.mimeType);
          return {
            ...part,
            inlineData: undefined, // Remove large base64
            fileUrl,
            mimeType: part.inlineData.mimeType
          };
        } catch (e) {
          console.error("Failed to upload to storage:", e);
          return part;
        }
      }
      return part;
    }));
    return { ...msg, parts: processedParts };
  }));

  if (chatId) {
    const chatRef = doc(db, 'chats', chatId);
    try {
      await updateDoc(chatRef, {
        messages: processedMessages,
        updatedAt: serverTimestamp(),
        title: title || messages[0]?.parts[0].text?.slice(0, 30) || 'Untitled Chat',
        summary: summary || ''
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
        messages: processedMessages,
        title: title || messages[0]?.parts[0].text?.slice(0, 30) || 'Untitled Chat',
        summary: summary || '',
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
