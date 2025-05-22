export const formatDateRange = (days: number): string => {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(endDate.getDate() - days);

  const formatOptions: Intl.DateTimeFormatOptions = {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  };

  const startStr = startDate.toLocaleDateString('fr-FR', formatOptions);
  const endStr = endDate.toLocaleDateString('fr-FR', formatOptions);

  return `Du ${startStr} au ${endStr}`;
};