import React from 'react';
import { statusLabel } from '../lib/format';

const styles = {
  pending:   'border-ink/40 dark:border-paper/40 opacity-80',
  preparing: 'border-ink dark:border-paper',
  ready:     'border-accent text-accent',
  served:    'bg-ink text-paper border-ink dark:bg-paper dark:text-ink dark:border-paper',
  cancelled: 'border-accent/40 text-accent/60 line-through'
};

export default function StatusBadge({ status }) {
  return (
    <span className={'chip border ' + (styles[status] || 'border-ink/40 dark:border-paper/40')}>
      {statusLabel(status)}
    </span>
  );
}