// src/components/PublicationDate.tsx
import React from "react";

interface PublicationDateProps {
  day?: number | null;
  month?: number | null;
  year?: number | null;
  className?: string;
}

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export default function PublicationDate({ day, month, year, className = "" }: PublicationDateProps) {
  if (!day && !month && !year) return null;

  let dateText = "";
  if (month && day && year) {
    dateText = `${MONTH_NAMES[month - 1]} ${day}, ${year}`;
  } else if (month && year) {
    dateText = `${MONTH_NAMES[month - 1]} ${year}`;
  } else if (year) {
    dateText = `${year}`;
  } else if (month) {
    dateText = MONTH_NAMES[month - 1];
  }

  return (
    <span className={`inline-flex items-center ${className}`}>
      <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
      {dateText}
    </span>
  );
}
