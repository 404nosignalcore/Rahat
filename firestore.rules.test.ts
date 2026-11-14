import fs from 'fs';
import path from 'path';

const rulesPath = path.resolve(process.cwd(), 'firestore.rules');
const rulesContent = fs.existsSync(rulesPath)
  ? fs.readFileSync(rulesPath, 'utf-8')
  : fs.readFileSync(path.resolve(process.cwd(), 'DRAFT_firestore.rules'), 'utf-8');

describe('Firestore Security Rules', () => {
  test('Dirty Dozen & Eight Pillars static security invariants on Firestore rules', () => {
    expect(rulesContent.includes("rules_version = '2';")).toBe(true);
    expect(rulesContent.includes('match /{document=**} {\n      allow read, write: if false;\n    }')).toBe(true);
    expect(rulesContent.includes('request.auth.token.email_verified == true')).toBe(true);
    expect(!rulesContent.includes('allow read: if isSignedIn();')).toBe(true);
    expect(rulesContent.includes('match /private/info')).toBe(true);
    expect(rulesContent.includes('isValidSafetyReport(incoming())')).toBe(true);
    expect(rulesContent.includes("incoming().verificationStatus == 'unverified'")).toBe(true);
    expect(rulesContent.includes("!(existing().status in ['resolved', 'cancelled'])")).toBe(true);
    expect(rulesContent.includes("existing().status != 'completed'")).toBe(true);
    expect(rulesContent.includes('resource.data.ownerUid == request.auth.uid')).toBe(true);
    expect(rulesContent.includes('get(/databases/$(database)/documents/safe_circles/$(circleId))')).toBe(true);
    expect(rulesContent.includes('isValidId(')).toBe(true);
  });
});
