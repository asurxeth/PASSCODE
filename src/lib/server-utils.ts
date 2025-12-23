'use server';

import { adminDb, adminAuth } from '@/firebase-admin/config';
import crypto from 'crypto';
import { FieldValue } from 'firebase-admin/firestore';

export function hashValue(value: string) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

export function generateToken() {
  return crypto.randomBytes(32).toString('hex');
}

export async function authenticateVerifier(apiKey: string) {
  const apiKeyHash = hashValue(apiKey);

  const snap = await adminDb
    .collection('verifiers')
    .where('apiKeyHash', '==', apiKeyHash)
    .where('status', '==', 'active')
    .limit(1)
    .get();

  if (snap.empty) {
    throw new Error('Unauthorized verifier');
  }

  return snap.docs[0];
}

export async function awardRewards(userId: string, requestId: string) {
  const rewardRef = adminDb.collection('rewards').doc(userId);
  const snap = await rewardRef.get();

  let points = 10;
  let totalVerifications = 1;

  if (snap.exists) {
    const data = snap.data();
    if(data) {
      points += data.points || 0;
      totalVerifications += data.totalVerifications || 0;
    }
  }

  let tier = 'bronze';
  if (totalVerifications >= 20) tier = 'gold';
  else if (totalVerifications >= 10) tier = 'silver';

  await rewardRef.set(
    {
      userId,
      points,
      tier,
      totalVerifications,
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true }
  );

  await adminDb.collection('reward_history').add({
    userId,
    requestId,
    pointsEarned: 10,
    reason: 'KYC verification',
    timestamp: FieldValue.serverTimestamp(),
  });
}
