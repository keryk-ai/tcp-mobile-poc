import { describe, it, expect, beforeAll } from 'vitest';
import {
  generateKeyPair,
  exportJWK,
  SignJWT,
  createLocalJWKSet,
  type JWTVerifyGetKey,
  type JWK,
} from 'jose';
import { verifyFirebaseIdToken } from '@/lib/verifyToken';

const PROJECT = 'awp-tcp';

let privateKey: CryptoKey;
let jwks: JWTVerifyGetKey;

beforeAll(async () => {
  const pair = await generateKeyPair('RS256');
  privateKey = pair.privateKey as CryptoKey;
  const jwk: JWK = await exportJWK(pair.publicKey);
  jwk.kid = 'test-key';
  jwk.alg = 'RS256';
  jwk.use = 'sig';
  jwks = createLocalJWKSet({ keys: [jwk] });
});

function signToken(overrides: {
  issuer?: string;
  audience?: string;
  subject?: string;
  expiresIn?: string;
  claims?: Record<string, unknown>;
} = {}) {
  return new SignJWT({ email: 'crew@verizon.com', org: 'verizon', ...overrides.claims })
    .setProtectedHeader({ alg: 'RS256', kid: 'test-key' })
    .setIssuer(overrides.issuer ?? `https://securetoken.google.com/${PROJECT}`)
    .setAudience(overrides.audience ?? PROJECT)
    .setSubject(overrides.subject ?? 'uid-123')
    .setIssuedAt()
    .setExpirationTime(overrides.expiresIn ?? '1h')
    .sign(privateKey);
}

describe('verifyFirebaseIdToken', () => {
  it('accepts a valid token and returns uid, email, org', async () => {
    const token = await signToken();
    const user = await verifyFirebaseIdToken(`Bearer ${token}`, { jwks, projectId: PROJECT });
    expect(user).toEqual({ uid: 'uid-123', email: 'crew@verizon.com', org: 'verizon' });
  });

  it('rejects a missing or non-Bearer header', async () => {
    expect(await verifyFirebaseIdToken(null, { jwks, projectId: PROJECT })).toBeNull();
    expect(await verifyFirebaseIdToken('Token abc', { jwks, projectId: PROJECT })).toBeNull();
  });

  it('rejects a garbage token', async () => {
    expect(await verifyFirebaseIdToken('Bearer not-a-jwt', { jwks, projectId: PROJECT })).toBeNull();
  });

  it('rejects the wrong audience', async () => {
    const token = await signToken({ audience: 'some-other-project' });
    expect(await verifyFirebaseIdToken(`Bearer ${token}`, { jwks, projectId: PROJECT })).toBeNull();
  });

  it('rejects the wrong issuer', async () => {
    const token = await signToken({ issuer: 'https://evil.example.com/awp-tcp' });
    expect(await verifyFirebaseIdToken(`Bearer ${token}`, { jwks, projectId: PROJECT })).toBeNull();
  });

  it('rejects an expired token', async () => {
    const token = await signToken({ expiresIn: '-1h' });
    expect(await verifyFirebaseIdToken(`Bearer ${token}`, { jwks, projectId: PROJECT })).toBeNull();
  });

  it('rejects when no project id is available', async () => {
    const token = await signToken();
    expect(await verifyFirebaseIdToken(`Bearer ${token}`, { jwks, projectId: undefined })).toBeNull();
  });
});
