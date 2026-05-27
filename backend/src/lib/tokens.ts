import crypto from 'crypto';

export interface InviteTokenPayload {
  email: string;
  workspaceId: string;
  workspaceName: string;
  role: string;
  invitedBy: string;
  expiresAt: number;
}

export function signToken(payload: InviteTokenPayload, secret: string): string {
  const payloadStr = JSON.stringify(payload);
  const payloadBase64 = Buffer.from(payloadStr).toString('base64url');
  
  // Sign using HMAC-SHA256
  const signature = crypto
    .createHmac('sha256', secret)
    .update(payloadBase64)
    .digest('base64url');
    
  return `${payloadBase64}.${signature}`;
}

export function verifyToken(token: string, secret: string): InviteTokenPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 2) return null;
    
    const [payloadBase64, signature] = parts;
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(payloadBase64)
      .digest('base64url');
      
    if (signature !== expectedSignature) {
      return null;
    }
    
    const payloadStr = Buffer.from(payloadBase64, 'base64url').toString('utf8');
    const payload = JSON.parse(payloadStr) as InviteTokenPayload;
    
    // Check expiration
    if (Date.now() > payload.expiresAt) {
      return null;
    }
    
    return payload;
  } catch (err) {
    console.error('[Token Verification Error]:', err);
    return null;
  }
}
