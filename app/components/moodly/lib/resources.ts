export interface CrisisResource {
  name: string;
  /** phone number, or text like "findahelpline.com" */
  detail: string;
  note: string;
  href: string;
}

/** The crisis resources the app has always shown, with their exact wording and numbers. */
export function resourcesFor(country: string): CrisisResource[] {
  if (country === 'Nepal') {
    return [
      { name: 'National Suicide Prevention Helpline', detail: '1166', note: 'Free, nationwide support', href: 'tel:1166' },
      { name: 'Police emergency', detail: '100', note: 'For immediate danger', href: 'tel:100' },
      { name: 'Ambulance', detail: '102', note: 'Emergency medical support', href: 'tel:102' },
    ];
  }
  return [
    { name: 'Local emergency services', detail: '112 / 911', note: 'Use the number available in your country', href: 'tel:112' },
    { name: 'Find a crisis centre', detail: 'findahelpline.com', note: 'Verified helplines in 175+ countries', href: 'https://findahelpline.com' },
  ];
}

export const HELP_TIPS = [
  'Move to a place where other people are nearby.',
  'Put distance between you and anything you could use to hurt yourself.',
  'Text or call someone you trust and say: "I need you with me right now."',
];

export const HELP_FOOT = "If a number doesn't connect, call your local emergency service or go to the nearest emergency department.";
