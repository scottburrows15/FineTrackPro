import type { User } from "@shared/schema";

/**
 * Gets the display name for a user, preferring nickname when available
 * Falls back to first name if nickname is empty or not provided
 */
export function getDisplayName(user: User | null | undefined): string {
  if (!user) return "User";
  
  // Use nickname if it exists and is not empty
  if (user.nickname && user.nickname.trim()) {
    return user.nickname.trim();
  }
  
  // Fall back to first name
  if (user.firstName && user.firstName.trim()) {
    return user.firstName.trim();
  }
  
  // Last resort - use email prefix or "User"
  if (user.email) {
    const emailPrefix = user.email.split('@')[0];
    return emailPrefix || "User";
  }
  
  return "User";
}

/**
 * Gets the full name for a user (first name + last name)
 * Used for formal contexts where nickname is not appropriate
 */
export function getFullName(user: User | null | undefined): string {
  if (!user) return "User";
  
  const firstName = user.firstName?.trim() || "";
  const lastName = user.lastName?.trim() || "";
  
  if (firstName && lastName) {
    return `${firstName} ${lastName}`;
  } else if (firstName) {
    return firstName;
  } else if (lastName) {
    return lastName;
  }
  
  // Fall back to email prefix or "User"
  if (user.email) {
    const emailPrefix = user.email.split('@')[0];
    return emailPrefix || "User";
  }
  
  return "User";
}

/**
 * Gets greeting text based on time of day and user's display name
 */
export function getGreeting(user: User | null | undefined): string {
  const displayName = getDisplayName(user);
  const hour = new Date().getHours();
  
  if (hour < 12) {
    return `Good morning, ${displayName}!`;
  } else if (hour < 17) {
    return `Good afternoon, ${displayName}!`;
  } else {
    return `Good evening, ${displayName}!`;
  }
}

/**
 * Formats a number as currency (GBP)
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
  }).format(amount);
}