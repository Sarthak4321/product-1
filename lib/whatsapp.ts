export interface LeadWhatsAppContext {
  phone: string;
  name?: string | null;
  class?: string | null;
  place?: string | null;
  course?: string | null;
  notes?: string | null;
}

export const DEFAULT_WHATSAPP_TEMPLATE = `Hello {{greeting_name}},

Thank you for speaking with us today regarding {{course_phrase}}.

We have noted your details and would be glad to share the complete batch schedule, syllabus structure, and admission details with you.

Please let us know if you have any questions or need guidance.

Best regards,
Admissions Team`;

export interface WhatsAppTemplate {
  id: string;
  name: string;
  template: string;
}

export const WHATSAPP_TEMPLATES: WhatsAppTemplate[] = [
  {
    id: "general",
    name: "General Details & Syllabus",
    template: DEFAULT_WHATSAPP_TEMPLATE,
  },
  {
    id: "intro",
    name: "Intro & Brochure",
    template: `Hello {{greeting_name}},

Thank you for speaking with us today regarding our {{course_phrase}}.

We have attached the brochure containing course outlines, batch timings, and faculty details. Please let us know if you'd like to schedule a trial session.

Best regards,
Admissions Team`,
  },
  {
    id: "fee_structure",
    name: "Fee Structure & Discounts",
    template: `Hello {{greeting_name}},

As requested, here are the fee structure and scholarship/discount options for {{course_phrase}}:
- Base Fee: Rs. 45,000 / year
- Early Bird Scholarship: 15% off (valid till this weekend)

Please reply if you would like to reserve a slot.

Best regards,
Admissions Team`,
  },
  {
    id: "trial_class",
    name: "Trial Class Registration",
    template: `Hello {{greeting_name}},

We invite you to attend a free trial class for {{course_phrase}} this Saturday at 10:00 AM.

Please reply to this message with "YES" to confirm your registration and receive the classroom entry pass.

Best regards,
Admissions Team`,
  },
  {
    id: "callback_reminder",
    name: "Callback Follow-up Reminder",
    template: `Hello {{greeting_name}},

I tried reaching out to you earlier regarding the {{course_phrase}}.

Please let me know a convenient time to schedule a quick callback today or tomorrow.

Best regards,
Admissions Team`,
  },
];

/**
 * Renders a template with safe fallback replacements.
 */
export function generateWhatsAppMessage(
  template: string = DEFAULT_WHATSAPP_TEMPLATE,
  lead: LeadWhatsAppContext
): string {
  const trimmedName = lead.name?.trim();
  const greetingName = trimmedName ? trimmedName : "there";
  const nameLine = trimmedName ? trimmedName : "Student / Parent";

  const classPhrase = lead.class?.trim()
    ? `Class ${lead.class.trim()}`
    : "your current grade";

  const coursePhrase = lead.course?.trim()
    ? `${lead.course.trim()} coaching program`
    : "our coaching programs";

  const placePhrase = lead.place?.trim()
    ? ` from ${lead.place.trim()}`
    : "";

  let message = template
    .replace(/\{\{greeting_name\}\}/g, greetingName)
    .replace(/\{\{name\}\}/g, nameLine)
    .replace(/\{\{class\}\}/g, lead.class?.trim() || "")
    .replace(/\{\{class_phrase\}\}/g, classPhrase)
    .replace(/\{\{course\}\}/g, lead.course?.trim() || "coaching")
    .replace(/\{\{course_phrase\}\}/g, coursePhrase)
    .replace(/\{\{place\}\}/g, lead.place?.trim() || "")
    .replace(/\{\{place_phrase\}\}/g, placePhrase);

  // Clean up any double empty lines created by empty replacements
  return message.replace(/\n{3,}/g, "\n\n").trim();
}

/**
 * Builds the WhatsApp deep link: https://wa.me/<phone>?text=<encoded>
 */
export function buildWhatsAppUrl(phoneNormalized: string, message: string): string {
  // Strip any non-digit
  const cleanPhone = phoneNormalized.replace(/\D/g, "");
  const encodedText = encodeURIComponent(message);
  return `https://wa.me/${cleanPhone}?text=${encodedText}`;
}
