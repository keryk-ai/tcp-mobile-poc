import { jwtVerify, createRemoteJWKSet, type JWTVerifyGetKey } from 'jose';

// Google's public JWKS for Firebase ID tokens (securetoken service account).
// Verifying against this requires NO firebase-admin and NO service-account credential.
const FIREBASE_JWKS_URL =
  'https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com';

let remoteJwks: JWTVerifyGetKey | null = null;

function defaultJwks(): JWTVerifyGetKey {
  // createRemoteJWKSet caches keys and honors Cache-Control — one instance per process.
  if (!remoteJwks) remoteJwks = createRemoteJWKSet(new URL(FIREBASE_JWKS_URL));
  return remoteJwks;
}

export interface VerifiedUser {
  uid: string;
  email?: string;
  org?: string;
}

export async function verifyFirebaseIdToken(
  authHeader: string | null,
  opts?: { jwks?: JWTVerifyGetKey; projectId?: string },
): Promise<VerifiedUser | null> {
  if (!authHeader?.startsWith('Bearer ')) return null;
  const token = authHeader.slice('Bearer '.length);

  const projectId =
    'projectId' in (opts ?? {}) ? opts?.projectId : process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  if (!projectId) return null;

  try {
    const { payload } = await jwtVerify(token, opts?.jwks ?? defaultJwks(), {
      issuer: `https://securetoken.google.com/${projectId}`,
      audience: projectId,
      algorithms: ['RS256'],
    });
    if (!payload.sub) return null;
    return {
      uid: payload.sub,
      email: typeof payload.email === 'string' ? payload.email : undefined,
      org: typeof payload.org === 'string' ? payload.org : undefined,
    };
  } catch {
    return null;
  }
}
