import { cookies } from 'next/headers';
import { verifyAuthToken, AuthTokenPayload } from './jwt';

export const AUTH_COOKIE_NAME = 'lh_auth_token';

export async function getCurrentUser(): Promise<AuthTokenPayload | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
    if (!token) return null;

    return await verifyAuthToken(token);
  } catch (err) {
    console.error('Error retrieving session:', err);
    return null;
  }
}
