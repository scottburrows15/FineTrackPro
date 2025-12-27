import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { 
  Activity,
  User,
  CreditCard,
  Trash2,
  Edit,
  Plus,
  ArrowUpDown,
  ChevronDown,
  ChevronRight,
  Search,
  Calendar,
  Filter,
  RefreshCw,
  Clock,
  History
} from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { cn } from "@/lib/utils";

interface AuditLogEntry {
  id: string;
  entityType: string;
  entityId: string;
  action: string;
  userId: string | null;
  changes: any;
  createdAt: string;
  description: string;
  user: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    email: string | null;
  } | null;
}

interface AuditData {
  logs: AuditLogEntry[];
  total: number;
}

interface AuditTrailModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ACTION_ICONS = {
  create: Plus,
  update: Edit,
  delete: Trash2,
  pay: CreditCard,
  payment_recorded: CreditCard,
  join_team: User,
  switch_team: ArrowUpDown,
  profile_updated: User,
  profile_image_updated: User,
  update_role: User,
  update_affiliation: User,
  remove_from_team: Trash2,
  reorder: ArrowUpDown,
} as const;

const ACTION_STYLES = {
  create: "bg-emerald-100 text-emerald-700 border-emerald-200",
  join_team: "bg-emerald-100 text-emerald-700 border-emerald-200",
  update: "bg-blue-100 text-blue-700 border-blue-200",
  profile_updated: "bg-blue-100 text-blue-700 border-blue-200",
  profile_image_updated: "bg-blue-100 text-blue-700 border-blue-200",
  update_role: "bg-amber-100 text-amber-700 border-amber-200",
  update_affiliation: "bg-blue-100 text-blue-700 border-blue-200",
  switch_team: "bg-indigo-100 text-indigo-700 border-indigo-200",
  reorder: "bg-indigo-100 text-indigo-700 border-indigo-200",
  delete: "bg-red-100 text-red-700 border-red-200",
  remove_from_team: "bg-red-100 text-red-700 border-red-200",
  pay: "bg-purple-100 text-purple-700 border-purple-200",
  payment_recorded: "bg-purple-100 text-purple-700 border-purple-200",
  default: "bg-slate-100 text-slate-700 border-slate-200"
};

const ENTITY_LABELS: Record<string, string> = {
  fine: "Fine",
  user: "Member",
  team: "Team",
  team_membership: "Membership",
  category: "Category",
  subcategory: "Subcategory",
};

export default function AuditTrailModal({ isOpen, onClose }: AuditTrailModalProps) {
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedEntry, setExpandedEntry] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<'all' | 'fines' | 'team'>('all');
  const limit = 50;
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: auditData, isLoading } = useQuery<AuditData>({
    queryKey: ['/api/admin/audit-log', page, limit, activeFilter],
    queryFn: async () => {
      const url = `/api/admin/audit-log?page=${page}&limit=${limit}&filter=${activeFilter}`;
      const response = await fetch(url, { credentials: 'include' });
      if (!response.ok) throw new Error(`${response.status}: ${response.statusText}`);
      return await response.json();
    },
    enabled: isOpen,
  });

  const migrateMutation = useMutation({
    mutationFn: async () => await apiRequest('POST', '/api/admin/migrate-audit-log'),
    onSuccess: () => {
      toast({ title: "Migration Complete", description: "History updated." });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/audit-log'] });
    },
    onError: (error: any) => {
      toast({ title: "Migration Failed", description: error.message, variant: "destructive" });
    },
  });

  const getActionIcon = (action: string) => {
    return ACTION_ICONS[action as keyof typeof ACTION_ICONS] || Activity;
  };

  const getUserName = (user: AuditLogEntry['user']) => {
    if (!user) return 'System';
    if (user.firstName && user.lastName) return `${user.firstName} ${user.lastName}`;
    return user.email || 'Unknown User';
  };

  const formatChanges = (changes: any) => {
    if (!changes || typeof changes !== 'object') return null;
    
    return (
      <div className="grid grid-cols-1 gap-2">
        {Object.entries(changes).map(([key, value]) => (
          <div key={key} className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-4 text-xs">
            <span className="font-semibold text-slate-500 shrink-0 min-w-[100px] uppercase tracking-wider text-[10px]">{key}</span>
            <span className="font-mono text-slate-700 bg-white px-2 py-1 rounded border border-slate-100 w-full break-all">
              {typeof value === 'object' ? JSON.stringify(value) : String(value)}
            </span>
          </div>
        ))}
      </div>
    );
  };

  const filteredLogs = auditData?.logs?.filter((log) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      log.description?.toLowerCase().includes(term) ||
      log.action.toLowerCase().includes(term) ||
      log.entityType.toLowerCase().includes(term) ||
      getUserName(log.user).toLowerCase().includes(term)
    );
  }) || [];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] max-w-2xl h-[85vh] p-0 gap-0 bg-slate-50/50 flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="bg-white border-b border-slate-100 p-4 shrink-0">
          <DialogHeader className="mb-4">
            <div className="flex items-center justify-between">
              <DialogTitle className="flex items-center gap-2 text-lg font-semibold text-slate-800">
                <div className="bg-blue-50 p-2 rounded-lg">
                  <History className="w-5 h-5 text-blue-600" />
                </div>
                Audit Trail
              </DialogTitle>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => migrateMutation.mutate()}
                disabled={migrateMutation.isPending}
                className="text-xs h-8 text-slate-500 hover:text-blue-600"
              >
                <RefreshCw className={cn("w-3 h-3 mr-2", migrateMutation.isPending && "animate-spin")} />
                Sync History
              </Button>
            </div>
          </DialogHeader>

          {/* Filter Tabs */}
          <div className="flex bg-slate-100 p-1 rounded-xl mb-3">
            {[
              { key: 'all', label: 'All Activity' },
              { key: 'fines', label: 'Fines' },
              { key: 'team', label: 'Team' },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => {
                  setActiveFilter(tab.key as 'all' | 'fines' | 'team');
                  setPage(1);
                }}
                data-testid={`filter-${tab.key}`}
                className={cn(
                  "flex-1 px-3 py-1.5 text-[11px] font-bold rounded-lg uppercase transition-all",
                  activeFilter === tab.key
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-400 hover:text-slate-600"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search logs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 h-9 text-sm bg-slate-50 border-slate-200 focus-visible:ring-1 focus-visible:ring-blue-500"
                data-testid="search-audit-logs"
              />
            </div>
          </div>
        </div>

        {/* Content */}
        <ScrollArea className="flex-1 bg-white">
          <div className="p-0">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center h-64 gap-3 text-slate-400">
                <RefreshCw className="w-6 h-6 animate-spin" />
                <span className="text-sm">Loading history...</span>
              </div>
            ) : filteredLogs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-slate-400 gap-2">
                <Search className="w-8 h-8 opacity-20" />
                <p className="text-sm">No records found</p>
              </div>
            ) : (
              <div className="relative">
                {/* Vertical Timeline Line */}
                <div className="absolute left-6 top-0 bottom-0 w-px bg-slate-100 z-0 hidden sm:block" />

                <div className="divide-y divide-slate-50">
                  {filteredLogs.map((log) => {
                    const ActionIcon = getActionIcon(log.action);
                    const isExpanded = expandedEntry === log.id;
                    const styleClass = ACTION_STYLES[log.action as keyof typeof ACTION_STYLES] || ACTION_STYLES.default;
                    
                    return (
                      <div 
                        key={log.id} 
                        className={cn(
                          "relative group transition-colors hover:bg-slate-50/50 cursor-pointer",
                          isExpanded ? "bg-slate-50/80" : "bg-white"
                        )}
                        onClick={() => setExpandedEntry(isExpanded ? null : log.id)}
                      >
                        <div className="flex p-4 gap-4">
                          {/* Timeline Icon */}
                          <div className="relative z-10 hidden sm:flex shrink-0">
                            <div className={cn(
                              "w-8 h-8 rounded-full flex items-center justify-center border shadow-sm",
                              styleClass,
                              "bg-white" 
                            )}>
                              <ActionIcon className="w-3.5 h-3.5" />
                            </div>
                          </div>

                          <div className="flex-1 min-w-0 space-y-1">
                            {/* Description and timestamp */}
                            <div className="flex items-start justify-between gap-3">
                              <p className="text-sm text-slate-700 leading-snug">
                                {log.description}
                              </p>
                              <div className="flex items-center text-xs text-slate-400 shrink-0 gap-1 pt-0.5">
                                <Clock className="w-3 h-3" />
                                {format(new Date(log.createdAt), 'MMM d, HH:mm')}
                              </div>
                            </div>

                            {/* Category badge */}
                            <div className="flex items-center gap-2">
                              <Badge variant="secondary" className="text-[10px] font-medium px-1.5 py-0 h-5 bg-slate-100 text-slate-600 border-slate-200">
                                {ENTITY_LABELS[log.entityType] || log.entityType}
                              </Badge>
                            </div>
                          </div>
                        </div>

                        {/* Expandable Details */}
                        {isExpanded && log.changes && (
                          <div className="pl-4 sm:pl-16 pr-4 pb-4 animate-in slide-in-from-top-1 duration-200">
                            <div className="bg-slate-100/50 rounded-lg p-3 border border-slate-200/60 text-sm">
                              {formatChanges(log.changes)}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Footer */}
        {auditData?.total && auditData.total > limit && (
          <div className="bg-white border-t border-slate-100 p-3 flex items-center justify-between shrink-0">
            <span className="text-xs text-slate-500 font-medium">
              Page {page} of {Math.ceil(auditData.total / limit)}
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="h-8 text-xs"
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => p + 1)}
                disabled={page * limit >= auditData.total}
                className="h-8 text-xs"
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
