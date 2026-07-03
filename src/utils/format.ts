import dayjs from 'dayjs';

export const formatDate = (value?: string) =>
  value ? dayjs(value).format('YYYY-MM-DD') : '-';

export const formatCurrency = (value?: number) =>
  value === undefined || value === null
    ? '-'
    : new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: 2,
      }).format(value);
