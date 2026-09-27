export type Profile = {
  age: string;
  gender: string;
  customGender: string;
  country: string;
  languages: string[];
  terms: boolean;
};

export const COUNTRIES = [
  "Nepal", "India", "United States", "United Kingdom", "Australia",
  "Canada", "Germany", "France", "Japan", "Singapore", "Other",
];
export const LANGUAGES = ["English", "Nepali", "Hindi", "Spanish", "French", "German", "Mandarin", "Japanese"];

export const emptyProfile: Profile = {
  age: "", gender: "", customGender: "", country: "Nepal", languages: ["English"], terms: false,
};

export function initialsFor(nickname: string, email: string) {
  const words = nickname.trim().split(/\s+/).filter(Boolean);
  if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase();
  const local = email.split("@")[0]?.replace(/[^a-zA-Z]/g, "") ?? "";
  return (local.slice(0, 2) || "?").toUpperCase();
}
