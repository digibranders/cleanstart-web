export interface PasswordRuleResult {
  label: string;
  met: boolean;
}

export interface PasswordCheck {
  ok: boolean;
  rules: PasswordRuleResult[];
}

export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_LETTER = /[A-Za-z]/;
export const PASSWORD_NUMBER = /\d/;
export const PASSWORD_SPECIAL = /[^A-Za-z0-9]/;
export const PASSWORD_RULES_MESSAGE = 'Meet all four password rules.';

/**
 * Portal password rule, decided 11 Nov 2026: 8 or more characters with a letter, a number and a special character.
 * Pure and client safe. The labels are the mock's, in the mock's order.
 */
export function checkPassword(password: string): PasswordCheck {
  const rules: PasswordRuleResult[] = [
    { label: 'At least 8 characters', met: password.length >= PASSWORD_MIN_LENGTH },
    { label: 'A letter', met: PASSWORD_LETTER.test(password) },
    { label: 'A number', met: PASSWORD_NUMBER.test(password) },
    { label: 'A special character', met: PASSWORD_SPECIAL.test(password) },
  ];
  return { ok: rules.every((rule) => rule.met), rules };
}
