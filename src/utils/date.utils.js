export const formatDate = (date) => {
  return date.toISOString().split('T')[0];
}

export const getFormattedDate = (daysToSubtract = 0) => {
  const date = new Date();
  date.setDate(date.getDate() - daysToSubtract);
  return formatDate(date);
}
