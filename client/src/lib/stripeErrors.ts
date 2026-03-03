export type StripeErrorKey =
  | 'card_declined'
  | 'expired_card'
  | 'incorrect_cvc'
  | 'incorrect_number'
  | 'insufficient_funds'
  | 'authentication_required'
  | 'processing_error'
  | 'generic';

const CODE_TO_KEY: Record<string, StripeErrorKey> = {
  card_declined: 'card_declined',
  expired_card: 'expired_card',
  incorrect_cvc: 'incorrect_cvc',
  incorrect_number: 'incorrect_number',
  invalid_number: 'incorrect_number',
  insufficient_funds: 'insufficient_funds',
  authentication_required: 'authentication_required',
  processing_error: 'processing_error',
};

export function getStripeErrorKey(code?: string | null): StripeErrorKey {
  if (!code) return 'generic';
  return CODE_TO_KEY[code] || 'generic';
}

