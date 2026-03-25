import { db, auth } from './firebase';
import { collection, addDoc, query, where, getDocs, updateDoc, doc, serverTimestamp, getDoc } from 'firebase/firestore';

export interface Plan {
  id: string;
  name: string;
  price: number;
  description: string;
  features: string[];
  maxModels: number;
}

export const FIXED_PLANS: Plan[] = [
  {
    id: 'basic',
    name: 'Basic',
    price: 300,
    description: 'Perfect for light use and learning.',
    features: ['Up to 2 paid models', 'Standard response speed', 'Basic support'],
    maxModels: 2
  },
  {
    id: 'standard',
    name: 'Standard',
    price: 600,
    description: 'Great for professionals and power users.',
    features: ['Up to 5 paid models', 'Fast response speed', 'Priority support'],
    maxModels: 5
  },
  {
    id: 'premium',
    name: 'Premium',
    price: 1200,
    description: 'The ultimate AI experience with no limits.',
    features: ['Up to 10 paid models', 'Ultra-fast response speed', '24/7 support'],
    maxModels: 10
  },
  {
    id: 'flexible',
    name: 'Flexible',
    price: 0, // Calculated based on usage
    description: 'Pay for what you use + 20% profit margin.',
    features: ['Unlimited models', 'Pay-as-you-go', 'Advanced analytics'],
    maxModels: 100
  }
];

export interface Subscription {
  id: string;
  userId: string;
  planType: string;
  selectedModels: string[];
  price: number;
  status: 'active' | 'expired' | 'pending';
  startDate: string;
  endDate: string;
}

export async function submitPayment(amount: number, receiptUrl: string) {
  const user = auth.currentUser;
  if (!user) throw new Error("User not authenticated");

  const paymentData = {
    userId: user.uid,
    amount,
    receiptUrl,
    status: 'pending',
    submittedAt: new Date().toISOString()
  };

  return await addDoc(collection(db, 'payments'), paymentData);
}

export async function getUserSubscription(): Promise<Subscription | null> {
  const user = auth.currentUser;
  if (!user) return null;

  const q = query(collection(db, 'subscriptions'), where('userId', '==', user.uid), where('status', '==', 'active'));
  const querySnapshot = await getDocs(q);

  if (querySnapshot.empty) return null;

  const doc = querySnapshot.docs[0];
  return { id: doc.id, ...doc.data() } as Subscription;
}

export async function createSubscription(planType: string, selectedModels: string[], price: number) {
  const user = auth.currentUser;
  if (!user) throw new Error("User not authenticated");

  const subscriptionData = {
    userId: user.uid,
    planType,
    selectedModels,
    price,
    status: 'pending',
    startDate: new Date().toISOString(),
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days
  };

  return await addDoc(collection(db, 'subscriptions'), subscriptionData);
}

export async function verifyPayment(paymentId: string, status: 'approved' | 'rejected', adminNotes?: string) {
  const paymentRef = doc(db, 'payments', paymentId);
  const paymentDoc = await getDoc(paymentRef);
  
  if (!paymentDoc.exists()) throw new Error("Payment not found");
  
  const paymentData = paymentDoc.data();
  
  await updateDoc(paymentRef, {
    status,
    verifiedAt: new Date().toISOString(),
    adminNotes
  });

  if (status === 'approved') {
    // Find the pending subscription for this user and activate it
    const q = query(collection(db, 'subscriptions'), where('userId', '==', paymentData.userId), where('status', '==', 'pending'));
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      const subRef = doc(db, 'subscriptions', querySnapshot.docs[0].id);
      await updateDoc(subRef, { status: 'active' });
      
      // Update user profile with subscription ID
      const userRef = doc(db, 'users', paymentData.userId);
      await updateDoc(userRef, { subscriptionId: subRef.id });
    }
  }
}
