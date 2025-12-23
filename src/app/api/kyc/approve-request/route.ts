
import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { adminDb, adminAuth } from '@/firebase-admin/config';
import { generateToken, hashValue, queueWebhook } from '@/lib/server-utils';
import { FieldValue } from 'firebase-admin/firestore';

export async function POST(request: Request) {
    const { requestId } = await request.json();
    const authorization = headers().get('Authorization');

    if (!authorization?.startsWith('Bearer ')) {
        return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });
    }
    
    const idToken = authorization.split('Bearer ')[1];

    if (!requestId || !idToken) {
        return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    try {
        const decodedToken = await adminAuth.verifyIdToken(idToken);
        const userId = decodedToken.uid;

        const requestRef = adminDb.collection('kyc_requests').doc(requestId);
        const requestSnap = await requestRef.get();

        if (!requestSnap.exists) {
            return NextResponse.json({ error: 'Request not found' }, { status: 404 });
        }

        const requestData = requestSnap.data();

        if (requestData?.userId !== userId) {
            return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
        }

        const token = generateToken();
        const tokenHash = hashValue(token);

        await adminDb.collection('verification_tokens').add({
            requestId,
            userId,
            verifierId: requestData.verifierId,
            tokenHash,
            used: false,
            expiresAt: new Date(Date.now() + 5 * 60 * 1000),
            createdAt: FieldValue.serverTimestamp(),
        });

        await requestRef.update({ status: 'approved' });

        // Queue webhook for the verifier
        await queueWebhook(requestData.verifierId, requestId);

        return NextResponse.json({ token });
    } catch (error: any) {
        console.error("Error during approval:", error);
        if (error.code === 'auth/id-token-expired') {
            return NextResponse.json({ error: 'ID token has expired' }, { status: 401 });
        }
        return NextResponse.json({ error: 'An error occurred during approval' }, { status: 500 });
    }
}

    