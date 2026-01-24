import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatNum(val: number, decimals = 1) {
  return val.toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })
}

export function getAvatarUrl(avatar: string | null | undefined): string {
  if (!avatar) return '';

  const avatarStr = String(avatar).trim();

  // SHA1 of empty string is da39766...
  // Also block "null", "undefined" as strings
  const isBroken =
    avatarStr.toLowerCase().includes('da39766') ||
    avatarStr.toLowerCase() === 'null' ||
    avatarStr.toLowerCase() === 'undefined' ||
    avatarStr === '';

  if (isBroken) return '';

  if (avatarStr.startsWith('http')) return avatarStr;

  const apiUrl = import.meta.env.VITE_API_URL || 'https://app.ytrc.co.th';
  const cleanBaseUrl = apiUrl.endsWith('/') ? apiUrl.slice(0, -1) : apiUrl;
  const avatarPath = avatarStr.startsWith('/') ? avatarStr : `/${avatarStr}`;

  // Handle the /api prefix for ytrc production environment
  if (cleanBaseUrl.includes('app.ytrc.co.th') && !cleanBaseUrl.endsWith('/api') && !avatarPath.startsWith('/api')) {
    return `${cleanBaseUrl}/api${avatarPath}`;
  }
  return `${cleanBaseUrl}${avatarPath}`;
}
