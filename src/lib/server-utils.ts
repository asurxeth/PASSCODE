'use server';

import { adminDb } from '@/firebase-admin/config';
import crypto from 'crypto';
import { FieldValue } from 'firebase-admin/firestore';

/* ---------- BASIC HELPERS ---------- */

export async function hashValue(value: string) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

export async function generateToken() {
  return crypto.randomBytes(32).toString('hex');
}

/* ---------- VERIFIER AUTH ---------- */

export async function authenticateVerifier(apiKey: string) {
  const apiKeyHash = await hashValue(apiKey); // ✅ FIXED

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

/* ---------- REWARDS ---------- */

export async function awardRewards(userId: string, requestId: string) {
  const rewardRef = adminDb.collection('rewards').doc(userId);
  const snap = await rewardRef.get();

  let points = 10;
  let totalVerifications = 1;

  if (snap.exists) {
    const data = snap.data();
    if (data) {
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

/* ---------- WEBHOOK QUEUE ---------- */

export async function queueWebhook(verifierId: string, requestId: string) {
  const verifierSnap = await adminDb
    .collection('verifiers')
    .doc(verifierId)
    .get();

  const verifier = verifierSnap.data();

  if (!verifier || !verifier.callbackUrl) return;

  const payload = {
    requestId,
    status: 'approved',
    timestamp: new Date().toISOString(),
  };

  await adminDb.collection('webhook_events').add({
    verifierId,
    callbackUrl: verifier.callbackUrl,
    payload,
    status: 'pending',
    attempts: 0,
    nextRetryAt: FieldValue.serverTimestamp(),
    createdAt: FieldValue.serverTimestamp(),
  });
}
