import { adminDb } from '@/firebase-admin/config';
import crypto from 'crypto';
import { FieldValue } from 'firebase-admin/firestore';

/* —————— BASIC HELPERS —————— */

export async function hashValue(value: string) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

export async function generateToken() {
  return crypto.randomBytes(32).toString('hex');
}

/* —————— VERIFIER AUTH —————— */

export async function authenticateVerifier(apiKey: string) {
  const apiKeyHash = await hashValue(apiKey); 
  const snap = await adminDb
    .collection('verifiers')
    .where('apiKeyHash', '==', apiKeyHash)
    .where('status', '==', 'active')
    .limit(1)
    .get();

  if (snap.empty) {
    throw new Error('Unauthorized verifier');
  }
  return snap.docs[0].data();
}

/* —————— MISSING FUNCTIONS (Add these back!) —————— */

export async function queueWebhook(url: string, payload: any) {
  // Add your webhook logic here or leave it as a placeholder for now
  console.log("Webhook queued for:", url);
  return true;
}

export async function awardRewards(userId: string, amount: number) {
  // Add your reward logic here or leave it as a placeholder
  console.log(`Awarding ${amount} to user ${userId}`);
  return true;
}
