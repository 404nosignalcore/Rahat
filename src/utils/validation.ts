/**
 * Programmatic validation synchronized with firebase-blueprint.json boundaries.
 */
export const FIELD_LIMITS = {
  displayName: { min: 1, max: 80 },
  reportTitle: { min: 5, max: 140 },
  reportDescription: { min: 10, max: 1000 },
  areaLabel: { min: 2, max: 120 },
  commentBody: { min: 2, max: 500 },
  postBody: { min: 5, max: 800 },
  contactName: { min: 1, max: 80 },
  contactPhone: { min: 5, max: 24 },
  circleName: { min: 2, max: 80 },
};

export function sanitizeText(input: string, maxLength: number): string {
  return input.replace(/[\u0000-\u001F\u007F]/g, '').trim().slice(0, maxLength);
}

export function validateSafetyReportInput(input: {
  title: string;
  description: string;
  areaLabel: string;
}): { valid: boolean; error?: string } {
  const title = input.title.trim();
  const description = input.description.trim();
  const areaLabel = input.areaLabel.trim();

  if (title.length < FIELD_LIMITS.reportTitle.min || title.length > FIELD_LIMITS.reportTitle.max) {
    return { valid: false, error: `Title must be ${FIELD_LIMITS.reportTitle.min}–${FIELD_LIMITS.reportTitle.max} characters.` };
  }
  if (
    description.length < FIELD_LIMITS.reportDescription.min ||
    description.length > FIELD_LIMITS.reportDescription.max
  ) {
    return {
      valid: false,
      error: `Description must be ${FIELD_LIMITS.reportDescription.min}–${FIELD_LIMITS.reportDescription.max} characters.`,
    };
  }
  if (areaLabel.length < FIELD_LIMITS.areaLabel.min || areaLabel.length > FIELD_LIMITS.areaLabel.max) {
    return { valid: false, error: `Area label must be ${FIELD_LIMITS.areaLabel.min}–${FIELD_LIMITS.areaLabel.max} characters.` };
  }
  return { valid: true };
}

export function validateEmergencyContactInput(input: {
  name: string;
  relationship: string;
  phone: string;
}): { valid: boolean; error?: string } {
  const name = input.name.trim();
  const relationship = input.relationship.trim();
  const phone = input.phone.trim();

  if (name.length < FIELD_LIMITS.contactName.min || name.length > FIELD_LIMITS.contactName.max) {
    return { valid: false, error: 'Please enter a valid contact name.' };
  }
  if (relationship.length < 1 || relationship.length > 40) {
    return { valid: false, error: 'Please enter relationship (e.g., Mother, Friend).' };
  }
  const digitsOnly = phone.replace(/[^0-9+]/g, '');
  if (digitsOnly.length < 5 || phone.length > FIELD_LIMITS.contactPhone.max) {
    return { valid: false, error: 'Please enter a valid phone number (5–24 chars).' };
  }
  return { valid: true };
}

export function canSubmitWithSpamCooldown(
  lastSubmittedAtMs: number | null,
  nowMs: number,
  cooldownMs = 15_000
): { allowed: boolean; waitSeconds: number } {
  if (lastSubmittedAtMs === null) {
    return { allowed: true, waitSeconds: 0 };
  }
  const elapsed = nowMs - lastSubmittedAtMs;
  if (elapsed >= cooldownMs) {
    return { allowed: true, waitSeconds: 0 };
  }
  return { allowed: false, waitSeconds: Math.ceil((cooldownMs - elapsed) / 1000) };
}
