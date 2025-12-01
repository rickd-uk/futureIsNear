// src/components/PublicationDate.tsx
import React from "react";

interface PublicationDateProps {
  month?: number | null;
  year?: number | null;
  className?: string;
}

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export default function PublicationDate({
  month,
  year,
  className = "",
}: PublicationDateProps) {
  // If neither month nor year is provided, don't display anything
  if (!month && !year) {
    return null;
  }

  // Format the date based on what's available
  let dateText = "";

  if (month && year) {
    // Both month and year available
    const monthName = MONTH_NAMES[month - 1]; // month is 1-indexed
    dateText = `${monthName} ${year}`;
  } else if (year) {
    // Only year available
    dateText = `${year}`;
  } else if (month) {
    // Only month available (unusual case)
    const monthName = MONTH_NAMES[month - 1];
    dateText = monthName;
  }

  return (
    <span className={`inline-flex items-center ${className}`}>
      <svg
        className="w-4 h-4 mr-1"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
        />
      </svg>
      {dateText}
    </span>
  );
}
