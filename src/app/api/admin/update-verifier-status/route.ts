
import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { adminDb, adminAuth } from '@/firebase-admin/config';

export async function POST(request: Request) {
    const { verifierId, status } = await request.json();
    const authorization = headers().get('Authorization');

    if (!authorization?.startsWith('Bearer ')) {
        return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });
    }
    
    const idToken = authorization.split('Bearer ')[1];

    if (!verifierId || !status) {
        return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    try {
        const decodedToken = await adminAuth.verifyIdToken(idToken);
        
        if (decodedToken.role !== 'admin') {
            return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
        }

        const verifierRef = adminDb.collection('verifiers').doc(verifierId);
        await verifierRef.update({ status });

        // Optionally, log this action to an audit trail
        await adminDb.collection('audit_logs').add({
            actor: decodedToken.uid,
            action: `VERIFIER_STATUS_CHANGED`,
            details: `Set status to ${status} for verifier ${verifierId}`,
            timestamp: new Date(),
        });

        return NextResponse.json({ success: true, message: `Verifier status updated to ${status}` });
    } catch (error: any) {
        console.error("Error updating verifier status:", error);
        if (error.code === 'auth/id-token-expired') {
            return NextResponse.json({ error: 'ID token has expired' }, { status: 401 });
        }
        return NextResponse.json({ error: 'An internal error occurred' }, { status: 500 });
    }
}
