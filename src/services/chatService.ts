import { db } from './firebase';
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

export interface ChatSession {
  id: string;
  userId: string;
  title: string;
  messages: Message[];
  updatedAt: any;
}

export const saveChat = async (userId: string, messages: Message[], chatId?: string, title?: string): Promise<string> => {
  try {
    if (chatId) {
      const chatRef = doc(db, 'chats', chatId);
      await updateDoc(chatRef, {
        messages,
        updatedAt: serverTimestamp(),
        title: title || messages[0]?.parts[0].text?.slice(0, 30) || 'Untitled Chat'
      });
      return chatId;
    } else {
      const chatRef = collection(db, 'chats');
      const newChat = await addDoc(chatRef, {
        userId,
        messages,
        title: title || messages[0]?.parts[0].text?.slice(0, 30) || 'Untitled Chat',
        updatedAt: serverTimestamp(),
        createdAt: serverTimestamp()
      });
      return newChat.id;
    }
  } catch (error) {
    console.error("Error saving chat:", error);
    throw error;
  }
};

export const getUserChats = async (userId: string): Promise<ChatSession[]> => {
  try {
    const chatRef = collection(db, 'chats');
    const q = query(
      chatRef, 
      where('userId', '==', userId), 
      orderBy('updatedAt', 'desc')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as ChatSession));
  } catch (error) {
    console.error("Error fetching user chats:", error);
    return [];
  }
};

export const deleteChat = async (chatId: string) => {
  try {
    await deleteDoc(doc(db, 'chats', chatId));
  } catch (error) {
    console.error("Error deleting chat:", error);
  }
};
