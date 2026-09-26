/**
 * Work Email Security & Validation Utility (Backend)
 * Enforces enterprise email requirements, rejects disposable/temporary domains,
 * and validates work email structure for Employee, Manager, and HR roles.
 */

const DISPOSABLE_DOMAINS = new Set([
  'tempmail.com',
  'mailinator.com',
  '10minutemail.com',
  'guerrillamail.com',
  'trashmail.com',
  'yopmail.com',
  'dispostable.com',
  'getairmail.com',
  'throwawaymail.com',
  'fakeinbox.com',
  'sharklasers.com',
  'nada.ltd',
  'inboxbear.com',
  'mytemp.email',
  'mohmal.com',
  'temp-mail.org',
]);

export interface WorkEmailValidationResult {
  isValid: boolean;
  error?: string;
  domain: string;
  isEnterpriseDomain: boolean;
}

export const validateWorkEmail = (
  email: string,
  role: string = 'EMPLOYEE'
): WorkEmailValidationResult => {
  const cleanEmail = email.toLowerCase().trim();

  // Basic RFC 5322 standard check
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(cleanEmail)) {
    return {
      isValid: false,
      error: 'Please enter a valid email format (e.g., name@company.com).',
      domain: '',
      isEnterpriseDomain: false,
    };
  }

  const parts = cleanEmail.split('@');
  const domain = parts[1];

  // 1. Block disposable email providers
  if (DISPOSABLE_DOMAINS.has(domain)) {
    return {
      isValid: false,
      error: 'Temporary or disposable email addresses are strictly prohibited for work accounts.',
      domain,
      isEnterpriseDomain: false,
    };
  }

  // 2. Validate domain syntax
  const domainParts = domain.split('.');
  const tld = domainParts[domainParts.length - 1];
  if (tld.length < 2) {
    return {
      isValid: false,
      error: 'Invalid top-level domain for work email.',
      domain,
      isEnterpriseDomain: false,
    };
  }

  const consumerDomains = new Set(['gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com', 'icloud.com', 'aol.com']);
  const isEnterpriseDomain = !consumerDomains.has(domain);

  return {
    isValid: true,
    domain,
    isEnterpriseDomain,
  };
};
