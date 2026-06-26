import React from 'react';
import { Button } from './ui/button';
import { PaginationMeta } from '../services/types';

interface PaginationProps {
  meta: PaginationMeta;
  onPageChange: (newPage: number) => void;
}

export const Pagination: React.FC<PaginationProps> = ({ meta, onPageChange }) => {
  if (meta.totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-center space-x-4 py-6">
      <Button
        variant="outline"
        size="sm"
        disabled={meta.page <= 1}
        onClick={() => onPageChange(meta.page - 1)}
        className="w-auto px-4"
      >
        Previous
      </Button>

      <span className="text-sm text-slate-500">
        Page <strong>{meta.page}</strong> of <strong>{meta.totalPages}</strong>
      </span>

      <Button
        variant="outline"
        size="sm"
        disabled={meta.page >= meta.totalPages}
        onClick={() => onPageChange(meta.page + 1)}
        className="w-auto px-4"
      >
        Next
      </Button>
    </div>
  );
};
