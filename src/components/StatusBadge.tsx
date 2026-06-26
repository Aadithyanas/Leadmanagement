import { Badge } from '@/components/ui/badge';
import type { LeadStatus } from '@/types';

const statusVariantMap: Record<LeadStatus, 'new' | 'contacted' | 'qualified' | 'proposal' | 'won' | 'lost' | 'rejected' | 'visited'> = {
  New: 'new',
  Contacted: 'contacted',
  Qualified: 'qualified',
  'Proposal Sent': 'proposal',
  Won: 'won',
  Lost: 'lost',
  Rejected: 'rejected',
  Visited: 'visited',
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
