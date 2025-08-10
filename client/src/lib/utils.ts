import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// UK currency formatting
export function formatCurrency(amount: number | string): string {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
  }).format(numAmount);
}

// UK date formatting
export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return 'N/A';
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  if (!dateObj || isNaN(dateObj.getTime())) return 'N/A';
  return dateObj.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export function formatDateTime(date: Date | string | null | undefined): string {
  if (!date) return 'N/A';
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  if (!dateObj || isNaN(dateObj.getTime())) return 'N/A';
  return dateObj.toLocaleString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// Calculate days overdue
export function getDaysOverdue(date: Date | string | null | undefined): number {
  if (!date) return 0;
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  if (!dateObj || isNaN(dateObj.getTime())) return 0;
  const now = new Date();
  const diffTime = now.getTime() - dateObj.getTime();
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
}

// Generate icon suggestions based on fine description
export function suggestIcon(description: string): string {
  const lowercased = description.toLowerCase();
  
  if (lowercased.includes('late') || lowercased.includes('arrival')) {
    return 'fas fa-clock';
  }
  if (lowercased.includes('kit') || lowercased.includes('shirt') || lowercased.includes('boots')) {
    return 'fas fa-tshirt';
  }
  if (lowercased.includes('red') && lowercased.includes('card')) {
    return 'fas fa-square';
  }
  if (lowercased.includes('yellow') && lowercased.includes('card')) {
    return 'fas fa-square-minus';
  }
  if (lowercased.includes('phone') || lowercased.includes('mobile')) {
    return 'fas fa-mobile-alt';
  }
  if (lowercased.includes('social') || lowercased.includes('event')) {
    return 'fas fa-users';
  }
  if (lowercased.includes('training') || lowercased.includes('practice')) {
    return 'fas fa-running';
  }
  if (lowercased.includes('match') || lowercased.includes('game')) {
    return 'fas fa-futbol';
  }
  
  return 'fas fa-gavel'; // Default icon
}
