export type UserVerificationStatus = typeof UserVerificationStatus[keyof typeof UserVerificationStatus];

export const UserVerificationStatus = {
  unverified: 'unverified',
  pending: 'pending',
  verified: 'verified',
} as const;
