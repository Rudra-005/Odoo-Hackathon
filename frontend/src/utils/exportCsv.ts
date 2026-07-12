/**
 * Converts an array of objects to a CSV string and triggers a browser download.
 */
export function exportToCsv(data: Record<string, any>[], filename: string) {
  if (!data || data.length === 0) {
    alert('No data to export.');
    return;
  }

  const headers = Object.keys(data[0]);
  const csvRows = [
    headers.map((h) => `"${h.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}"`).join(','),
    ...data.map((row) =>
      headers
        .map((h) => {
          const val = row[h] ?? '';
          // Escape quotes inside values
          return `"${String(val).replace(/"/g, '""')}"`;
        })
        .join(',')
    ),
  ];

  const csvContent = csvRows.join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `${filename}_${Date.now()}.csv`);
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
