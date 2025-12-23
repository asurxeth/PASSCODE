
import { NextResponse } from 'next/server';
import { adminDb } from '@/firebase-admin/config';
import { authenticateVerifier, hashValue, awardRewards } from '@/lib/server-utils';
import { FieldValue } from 'firebase-admin/firestore';

export async function POST(request: Request) {
  try {
    const { apiKey, token } = await request.json();
    const verifierDoc = await authenticateVerifier(apiKey);

    const tokenHash = hashValue(token);

    const snap = await adminDb
      .collection('verification_tokens')
      .where('tokenHash', '==', tokenHash)
      .where('used', '==', false)
      .limit(1)
      .get();

    if (snap.empty) {
      return NextResponse.json({ error: 'Invalid or used token' }, { status: 400 });
    }

    const tokenDoc = snap.docs[0];
    const tokenData = tokenDoc.data();

    if (new Date() > tokenData.expiresAt.toDate()) {
        await tokenDoc.ref.update({
            status: "expired"
        });
        return NextResponse.json({ error: 'Token has expired' }, { status: 400 });
    }

    if (tokenData.verifierId !== verifierDoc.id) {
      return NextResponse.json({ error: 'Verifier mismatch' }, { status: 403 });
    }

    // Mark token as used
    await tokenDoc.ref.update({
      used: true,
      usedAt: FieldValue.serverTimestamp(),
    });
    
    // Fetch request to get requested fields
    const requestSnap = await adminDb.collection('kyc_requests').doc(tokenData.requestId).get();
    const requestData = requestSnap.data();

    if (!requestData) {
         return NextResponse.json({ error: 'Original request not found' }, { status: 404 });
    }

    const userProfileSnap = await adminDb.collection('users').doc(tokenData.userId).get();
    const userProfile = userProfileSnap.data() || {};
    
    const kycProfile: Record<string, any> = {};

    for (const field of requestData.requestedFields) {
        // A mapping from requested fields to UserProfile fields
        const fieldMapping: Record<string, string> = {
            'Full Name': 'fullName',
            'ID Number': 'idNumber',
            'Address': 'address',
            'DOB': 'dob',
            'name': 'fullName',
        };
        const mappedField = fieldMapping[field] || field.toLowerCase();
        if(userProfile[mappedField]) {
            kycProfile[mappedField] = userProfile[mappedField];
        }
    }

    // Audit log
    await adminDb.collection('verification_logs').add({
      userId: tokenData.userId,
      verifierId: verifierDoc.id,
      requestId: tokenData.requestId,
      verifiedFields: requestData.requestedFields,
      timestamp: FieldValue.serverTimestamp(),
      ipAddress: request.headers.get('x-forwarded-for') ?? request.headers.get('x-real-ip') ?? request.headers.get('remote-addr')
    });

    // Reward user
    await awardRewards(tokenData.userId, tokenData.requestId);

    return NextResponse.json({
      verified: true,
      kycProfile: kycProfile
    });
  } catch (err: any) {
    console.error(`Error in /api/kyc/verify: ${err.message}`);
    return NextResponse.json({ error: 'An internal error occurred.' }, { status: 500 });
  }
}
