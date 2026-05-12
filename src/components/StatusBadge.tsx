import { Badge } from '@/components/ui/badge';
import type { LeadStatus } from '@/types';

const statusVariantMap: Record<LeadStatus, 'new' | 'contacted' | 'qualified' | 'proposal' | 'won' | 'lost'> = {
  New: 'new',
  Contacted: 'contacted',
  Qualified: 'qualified',
  'Proposal Sent': 'proposal',
  Won: 'won',
  Lost: 'lost',
};

interface StatusBadgeProps {
  status: LeadStatus;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  return (
    <Badge variant={statusVariantMap[status]} className={className}>
      {status}
    </Badge>
  );
}
