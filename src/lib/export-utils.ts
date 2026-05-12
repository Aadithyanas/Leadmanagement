import { Lead } from '@/types';

export function exportLeadsToCSV(leads: Lead[]) {
  if (!leads.length) return;

  const headers = [
    'Name',
    'Company',
    'Email',
    'Phone',
    'Status',
    'Industry',
    'Website',
    'Map Link',
    'Last Discussion',
    'Follow Up At',
    'Created At'
  ];

  const rows = leads.map(l => {
    const isMap = l.websiteUrl?.includes('google.com/maps') || l.websiteUrl?.includes('goo.gl/maps');
    return [
      `"${l.name.replace(/"/g, '""')}"`,
      `"${l.company.replace(/"/g, '""')}"`,
      `"${l.email}"`,
      `"${l.phone}"`,
      `"${l.status}"`,
      `"${l.industry}"`,
      `"${!isMap ? (l.websiteUrl || '') : ''}"`,
      `"${isMap ? l.websiteUrl : ''}"`,
      `"${l.lastDiscussion.replace(/"/g, '""')}"`,
      l.followUpAt ? new Date(l.followUpAt).toLocaleDateString() : 'N/A',
      new Date(l.createdAt).toLocaleDateString()
    ];
  });

  const csvContent = [
    headers.join(','),
    ...rows.map(r => r.join(','))
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `leadflow_export_${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
