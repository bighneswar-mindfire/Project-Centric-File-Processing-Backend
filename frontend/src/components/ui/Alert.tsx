import * as React from 'react';

export const Alert = ({ className = '', ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    role="alert"
    className={`relative w-full rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800 ${className}`}
    {...props}
  />
);
