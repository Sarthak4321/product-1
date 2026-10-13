import { generateWhatsAppMessage, buildWhatsAppUrl, DEFAULT_WHATSAPP_TEMPLATE } from "../whatsapp";

describe("generateWhatsAppMessage & buildWhatsAppUrl Edge Cases", () => {
  describe("Template Substitution & Fallback Behavior", () => {
    it("substitutes all placeholders when complete lead info is provided", () => {
      const template = "Hi {{greeting_name}} from {{place_phrase}}, regarding {{course_phrase}} for {{class_phrase}}.";
      const lead = {
        phone: "919876543210",
        name: "Rahul Das",
        class: "12",
        place: "Durgapur",
        course: "JEE Main",
      };

      const msg = generateWhatsAppMessage(template, lead);
      expect(msg).toBe("Hi Rahul Das from  from Durgapur, regarding JEE Main coaching program for Class 12.");
    });

    it("handles missing name safely by substituting 'there'", () => {
      const template = "Hello {{greeting_name}},\nThank you for reaching out.";
      const lead = { phone: "919876543210", name: null };

      const msg = generateWhatsAppMessage(template, lead);
      expect(msg).toBe("Hello there,\nThank you for reaching out.");
      expect(msg).not.toContain("Hello ,");
    });

    it("handles missing course gracefully with default phrase 'our coaching programs'", () => {
      const template = "Regarding {{course_phrase}}, please find details below.";
      const lead = { phone: "919876543210", course: "" };

      const msg = generateWhatsAppMessage(template, lead);
      expect(msg).toBe("Regarding our coaching programs, please find details below.");
    });

    it("handles special characters in student names (accents, apostrophes)", () => {
      const template = "Hello {{greeting_name}}!";
      const lead = { phone: "919876543210", name: "D'Souza & Co." };

      const msg = generateWhatsAppMessage(template, lead);
      expect(msg).toBe("Hello D'Souza & Co.!");
    });

    it("uses DEFAULT_WHATSAPP_TEMPLATE when template is omitted or undefined", () => {
      const lead = {
        phone: "919876543210",
        name: "Ananya Roy",
        course: "NEET Medical",
      };

      const msg = generateWhatsAppMessage(undefined, lead);
      expect(msg).toContain("Hello Ananya Roy");
      expect(msg).toContain("NEET Medical coaching program");
    });

    it("cleans up excess consecutive newlines created by empty replacements", () => {
      const template = "Line 1\n\n\n\n\nLine 2";
      const msg = generateWhatsAppMessage(template, { phone: "919876543210" });
      expect(msg).toBe("Line 1\n\nLine 2");
    });
  });

  describe("buildWhatsAppUrl Deep Link Generation", () => {
    it("encodes spaces, linebreaks, and special URL characters cleanly", () => {
      const text = "Hello Rahul!\nPrice: ₹10,000 & 50% off?";
      const url = buildWhatsAppUrl("919876543210", text);

      expect(url.startsWith("https://wa.me/919876543210?text=")).toBe(true);
      expect(url).toContain(encodeURIComponent(text));
    });

    it("strips non-digit characters from the phone number in the URL", () => {
      const url = buildWhatsAppUrl("+91 (987) 654-3210", "Hi");
      expect(url.startsWith("https://wa.me/919876543210?text=")).toBe(true);
    });
  });

  describe("WHATSAPP_TEMPLATES Configuration", () => {
    it("contains defined non-empty templates with unique ids", () => {
      const { WHATSAPP_TEMPLATES } = require("../whatsapp");
      expect(Array.isArray(WHATSAPP_TEMPLATES)).toBe(true);
      expect(WHATSAPP_TEMPLATES.length).toBeGreaterThan(2);

      const ids = WHATSAPP_TEMPLATES.map((t: any) => t.id);
      const uniqueIds = Array.from(new Set(ids));
      expect(ids.length).toBe(uniqueIds.length); // Ensure unique ids

      WHATSAPP_TEMPLATES.forEach((t: any) => {
        expect(typeof t.id).toBe("string");
        expect(typeof t.name).toBe("string");
        expect(typeof t.template).toBe("string");
        expect(t.template.length).toBeGreaterThan(10);
      });
    });
  });
});
