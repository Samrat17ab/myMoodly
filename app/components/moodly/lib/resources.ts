export interface CrisisResource {
  name: string;
  /** phone number, or text like "findahelpline.com" */
  detail: string;
  note: string;
  href: string;
}

/** India-only contacts shared by both help surfaces, independent of profile country.
 * Verified 2026-11-06: Ministry of Home Affairs ERSS and the local helpline lookup.
 * https://www.mha.gov.in/emergency-response-support-system-erss
 * https://telemanas.mohfw.gov.in/home
 */
export const INDIA_RESOURCES: readonly CrisisResource[] = [
  { name: 'Emergency services in India', detail: '112', note: 'For immediate danger or a police, fire or medical emergency', href: 'tel:112' },
  { name: 'Tele-MANAS mental health support', detail: '14416', note: 'Free, confidential mental health support in India, available 24/7', href: 'tel:+9114416?oai_link_source=model_response_hotline' },
];

export const HELP_LOCATION = 'These numbers are for people currently in India. If you are outside India, contact your local emergency service or use the helpline directory below.';

export const HELP_TIPS = [
  'Move to a place where other people are nearby.',
  "Take a few slow breaths. You don't have to decide or fix anything right now.",
  'Text or call someone you trust and say: "I need you with me right now."',
];

export const HELP_FOOT = "If a number doesn't connect, call your local emergency service or go to the nearest emergency department.";
