'use server';

import crypto from 'crypto';
import { FieldValue } from 'firebase-admin/firestore';

export async function hashValue(value: string) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

export async function generateToken() {
  return crypto.randomBytes(32).toString('hex');
}
