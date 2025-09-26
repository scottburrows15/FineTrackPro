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
import { Card, CardContent } from "@/components/ui/card";
import { 
  Activity,
  User,
  CreditCard,
  FileText,
  Settings,
  Trash2,
  Edit,
  Plus,
  ArrowUpDown,
  ChevronDown,
  ChevronRight,
  Search,
  Calendar,
  Filter,
  RefreshCw
} from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface AuditLogEntry {
  id: string;
  entityType: string;
  entityId: string;
  action: string;
  userId: string | null;
  changes: any;
  createdAt: string;
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
  profile_updated: User,
  reorder: ArrowUpDown,
} as const;

const ACTION_LABELS = {
  create: "Created",
  update: "Updated", 
  delete: "Deleted",
  pay: "Paid",
  payment_recorded: "Payment Recorded",
  join_team: "Joined Team",
  profile_updated: "Profile Updated",
  reorder: "Reordered",
} as const;

const ENTITY_LABELS = {
  fine: "Fine",
  user: "User",
  team: "Team",
  category: "Category",
  subcategory: "Subcategory",
} as const;

export default function AuditTrailModal({ isOpen, onClose }: AuditTrailModalProps) {
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedEntry, setExpandedEntry] = useState<string | null>(null);
  const limit = 50;
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: auditData, isLoading } = useQuery<AuditData>({
    queryKey: ['/api/admin/audit-log', page, limit],
    queryFn: async () => {
      const url = `/api/admin/audit-log?page=${page}&limit=${limit}`;
      const response = await fetch(url, { credentials: 'include' });
      if (!response.ok) {
        throw new Error(`${response.status}: ${response.statusText}`);
      }
      return await response.json();
    },
    enabled: isOpen,
  });

  const migrateMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest('POST', '/api/admin/migrate-audit-log');
    },
    onSuccess: () => {
      toast({
        title: "Migration Complete",
        description: "Existing fines and user data have been added to audit trail",
      });
      // Refresh the audit log data - invalidate all audit log queries
      queryClient.invalidateQueries({ 
        queryKey: ['/api/admin/audit-log']
        // By default, partial matching is used, so this will invalidate all queries starting with this key
      });
    },
    onError: (error: any) => {
      toast({
        title: "Migration Failed",
        description: error.message || "Failed to migrate existing data",
        variant: "destructive",
      });
    },
  });

  const getActionIcon = (action: string) => {
    const Icon = ACTION_ICONS[action as keyof typeof ACTION_ICONS] || Activity;
    return Icon;
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'create':
      case 'join_team':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'update':
      case 'profile_updated':
      case 'reorder':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'delete':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'pay':
      case 'payment_recorded':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getUserName = (user: AuditLogEntry['user']) => {
    if (!user) return 'System';
    if (user.firstName && user.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    if (user.firstName) return user.firstName;
    if (user.lastName) return user.lastName;
    if (user.email) return user.email;
    return 'Unknown User';
  };

  const formatChanges = (changes: any) => {
    if (!changes || typeof changes !== 'object') return null;
    
    return Object.entries(changes).map(([key, value]) => (
      <div key={key} className="text-sm">
        <span className="font-medium text-slate-600">{key}:</span>{' '}
        <span className="text-slate-800">
          {typeof value === 'object' ? JSON.stringify(value) : String(value)}
        </span>
      </div>
    ));
  };

  const filteredLogs = auditData?.logs?.filter((log: AuditLogEntry) => {
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    return (
      log.action.toLowerCase().includes(searchLower) ||
      log.entityType.toLowerCase().includes(searchLower) ||
      getUserName(log.user).toLowerCase().includes(searchLower) ||
      log.entityId.toLowerCase().includes(searchLower)
    );
  }) || [];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] sm:max-w-4xl max-h-[90vh] overflow-hidden flex flex-col p-3 sm:p-6">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Audit Trail
            </DialogTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => migrateMutation.mutate()}
                disabled={migrateMutation.isPending}
                className="flex items-center gap-2"
              >
                <RefreshCw className={`w-4 h-4 ${migrateMutation.isPending ? 'animate-spin' : ''}`} />
                {migrateMutation.isPending ? 'Migrating...' : 'Add Existing Data'}
              </Button>
              <Button variant="outline" size="sm" onClick={onClose}>
                Close
              </Button>
            </div>
          </div>
        </DialogHeader>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Search activities..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <Filter className="w-4 h-4" />
            <span>{filteredLogs.length} of {auditData?.logs?.length || 0} activities</span>
          </div>
        </div>

        {/* Audit Log Content */}
        <div className="flex-1 overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              {searchTerm ? 'No activities found matching your search.' : 'No audit log entries found.'}
            </div>
          ) : (
            <ScrollArea className="h-full">
              <div className="space-y-3">
                {filteredLogs.map((log: AuditLogEntry) => {
                  const ActionIcon = getActionIcon(log.action);
                  const isExpanded = expandedEntry === log.id;
                  
                  return (
                    <Card key={log.id} className="border border-slate-200">
                      <CardContent className="p-4">
                        <div 
                          className="flex items-start justify-between cursor-pointer"
                          onClick={() => setExpandedEntry(isExpanded ? null : log.id)}
                        >
                          <div className="flex items-start gap-3 flex-1">
                            <div className="flex-shrink-0 mt-1">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${getActionColor(log.action)}`}>
                                <ActionIcon className="w-4 h-4" />
                              </div>
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <Badge variant="outline" className={getActionColor(log.action)}>
                                  {ACTION_LABELS[log.action as keyof typeof ACTION_LABELS] || log.action}
                                </Badge>
                                <span className="text-sm font-medium text-slate-700">
                                  {ENTITY_LABELS[log.entityType as keyof typeof ENTITY_LABELS] || log.entityType}
                                </span>
                              </div>
                              
                              <div className="text-sm text-slate-600">
                                <span className="font-medium">{getUserName(log.user)}</span>
                                {' '}{ACTION_LABELS[log.action as keyof typeof ACTION_LABELS]?.toLowerCase() || log.action}{' '}
                                {log.entityType === 'fine' && 'a fine'}
                                {log.entityType === 'user' && 'user profile'}
                                {log.entityType === 'team' && 'team settings'}
                                {log.entityType === 'category' && 'fine category'}
                                {log.entityType === 'subcategory' && 'fine type'}
                              </div>
                              
                              <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
                                <div className="flex items-center gap-1">
                                  <Calendar className="w-3 h-3" />
                                  {format(new Date(log.createdAt), 'MMM dd, yyyy HH:mm')}
                                </div>
                                {log.entityId && (
                                  <div className="truncate">
                                    ID: {log.entityId.slice(0, 8)}...
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex-shrink-0 ml-2">
                            {isExpanded ? (
                              <ChevronDown className="w-4 h-4 text-slate-400" />
                            ) : (
                              <ChevronRight className="w-4 h-4 text-slate-400" />
                            )}
                          </div>
                        </div>
                        
                        {/* Expanded Details */}
                        {isExpanded && log.changes && (
                          <div className="mt-4 pt-3 border-t border-slate-100">
                            <h4 className="text-sm font-medium text-slate-700 mb-2">Changes:</h4>
                            <div className="bg-slate-50 rounded-lg p-3 space-y-1">
                              {formatChanges(log.changes)}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </ScrollArea>
          )}
        </div>

        {/* Pagination */}
        {auditData?.total && auditData.total > limit && (
          <div className="flex items-center justify-between pt-4 border-t">
            <div className="text-sm text-slate-600">
              Showing {((page - 1) * limit) + 1} to {Math.min(page * limit, auditData.total)} of {auditData.total} activities
            </div>
            
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => p + 1)}
                disabled={page * limit >= auditData.total}
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