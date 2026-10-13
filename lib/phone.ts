export interface ParsedPhone {
  isValid: boolean;
  normalized: string; // e.g. "919876543210" or international
  display: string;    // e.g. "+91 98765 43210"
  tel: string;        // e.g. "tel:+919876543210"
  error?: string;
  altPhones?: string[]; // Extra valid phone numbers found in the same multi-contact cell
}

/**
 * Parses a single phone string candidate.
 */
function parseAndNormalizeSinglePhone(input: string | number | null | undefined): ParsedPhone {
  if (!input) {
    return { isValid: false, normalized: "", display: "", tel: "", error: "Phone number is empty" };
  }

  const raw = String(input).trim();
  // Strip whitespace, dashes, parentheses, dots
  let cleaned = raw.replace(/[\s\-\(\)\.]/g, "");

  // Remove leading plus for processing
  const hasPlus = cleaned.startsWith("+");
  if (hasPlus) {
    cleaned = cleaned.substring(1);
  }

  // Remove leading 0 if present (e.g. 09876543210)
  if (cleaned.startsWith("0") && cleaned.length === 11) {
    cleaned = cleaned.substring(1);
  }

  // Case 1: 10 digits -> Indian mobile number
  if (/^[6-9]\d{9}$/.test(cleaned)) {
    const normalized = "91" + cleaned;
    const display = `+91 ${cleaned.slice(0, 5)} ${cleaned.slice(5)}`;
    return {
      isValid: true,
      normalized,
      display,
      tel: `tel:+${normalized}`,
    };
  }

  // Case 2: 12 digits starting with 91 (India)
  if (/^91[6-9]\d{9}$/.test(cleaned)) {
    const mobile10 = cleaned.slice(2);
    const display = `+91 ${mobile10.slice(0, 5)} ${mobile10.slice(5)}`;
    return {
      isValid: true,
      normalized: cleaned,
      display,
      tel: `tel:+${cleaned}`,
    };
  }

  // Case 3: Other international numbers (explicit + prefix or 11-15 digits)
  if ((hasPlus || cleaned.length > 10) && /^\d{8,15}$/.test(cleaned)) {
    return {
      isValid: true,
      normalized: cleaned,
      display: `+${cleaned}`,
      tel: `tel:+${cleaned}`,
    };
  }

  return {
    isValid: false,
    normalized: cleaned,
    display: raw,
    tel: "",
    error: `Invalid phone format "${raw}". Must be a valid 10-digit mobile number.`,
  };
}

/**
 * Normalizes and validates a phone number or multi-contact cell entry.
 * Intelligently handles multi-number cells separated by /, \, comma, semicolon, |, &, or "or".
 * Extracts the primary mobile number and preserves secondary numbers in altPhones.
 */
export function parseAndNormalizePhone(input: string | number | null | undefined): ParsedPhone {
  if (!input) {
    return { isValid: false, normalized: "", display: "", tel: "", error: "Phone number is empty" };
  }

  const raw = String(input).trim();

  // Try single phone parse first
  const singleResult = parseAndNormalizeSinglePhone(raw);
  if (singleResult.isValid) {
    return singleResult;
  }

  // If raw contains multi-number delimiters like / \ , ; | & "or" "and", split & extract candidates
  const multiDelimPattern = /[/\\,;|\n\r&]|\s+(?:or|and)\s+/i;
  if (multiDelimPattern.test(raw)) {
    const segments = raw
      .split(multiDelimPattern)
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    const validPhones: ParsedPhone[] = [];

    for (const segment of segments) {
      const candidate = parseAndNormalizeSinglePhone(segment);
      if (candidate.isValid && !validPhones.some((p) => p.normalized === candidate.normalized)) {
        validPhones.push(candidate);
      }
    }

    if (validPhones.length > 0) {
      const primary = validPhones[0];
      const altPhones = validPhones.slice(1).map((p) => p.display);
      return {
        ...primary,
        altPhones,
      };
    }
  }

  return singleResult;
}
