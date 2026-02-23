export const RANKS = [
  { value: "Rabat", label: "Rabat (רב״ט)" },
  { value: "Samal", label: "Samal (סמל)" },
  { value: "Samar", label: "Samar (סמ״ר)" },
  { value: "Rasal", label: "Rasal (רס״ל)" },
  { value: "Rasar", label: "Rasar (רס״ר)" },
  { value: "Rasam", label: "Rasam (רס״מ)" },
  { value: "Rasab", label: "Rasab (רס״ב)" },
  { value: "Ranag", label: "Ranag (רנ״ג)" },
  { value: "Sagam", label: "Sagam (סג״ם)" },
  { value: "Segen", label: "Segen (סגן)" },
  { value: "Seren", label: "Seren (סרן)" },
  { value: "Rasan", label: "Rasan (רס״ן)" },
  { value: "Saal", label: "Sa'al (סא״ל)" },
  { value: "Alam", label: "Alam (אל״ם)" },
  { value: "Taal", label: "Ta'al (תא״ל)" },
  { value: "Aluf", label: "Aluf (אלוף)" },
  { value: "Raal", label: "Ra'al (רא״ל)" },
  { value: "Kama", label: "Kama (קמ״א)" },
  { value: "Kaab", label: "Ka'ab (קא״ב)" },
  { value: "Kaam", label: "Ka'am (קא״ם)" },
] as const;

export const JOBS = ["Doctor", "Paramedic", "Medic", "Logistical", "Other"] as const;

export const SYSTEM_ROLES = [
  { value: "General", label: "General User" },
  { value: "Admin", label: "Admin" },
  { value: "Temp_Admin", label: "Temp Admin" },
] as const;

export const ACTION_TYPES = ["Given", "Administered", "Returned", "Lost/Damaged"] as const;

export function formatPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, "");
  if (cleaned.length === 10) {
    return `${cleaned.slice(0, 3)}-${cleaned.slice(3)}`;
  }
  return phone;
}

export function getRankLabel(value: string): string {
  return RANKS.find((r) => r.value === value)?.label || value;
}

export function formatDate(value: string | Date): string {
  return new Date(value).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function formatDateTime(value: string | Date): string {
  return new Date(value).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}
