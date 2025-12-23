import { NextResponse } from 'next/server';
import { adminDb } from '@/firebase-admin/config';
import { authenticateVerifier } from '@/lib/server-utils';
import { FieldValue } from 'firebase-admin/firestore';

export async function POST(request: Request) {
  try {
    const { apiKey, userId, requestedFields } = await request.json();

    if (!apiKey || !userId || !requestedFields) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const verifierDoc = await authenticateVerifier(apiKey);

    const requestRef = await adminDb.collection('kyc_requests').add({
      userId,
      verifierId: verifierDoc.id,
      requestedFields,
      status: 'pending',
      expiresAt: FieldValue.serverTimestamp(
        new Date(Date.now() + 10 * 60 * 1000)
      ),
      createdAt: FieldValue.serverTimestamp(),
    });

    return NextResponse.json({ requestId: requestRef.id });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 401 });
  }
}
