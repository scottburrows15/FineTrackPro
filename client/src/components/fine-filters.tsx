import { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import BulkActionsBar from "./bulk-actions-bar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { 
  Search, 
  Filter, 
  X, 
  ChevronDown,
  ChevronRight,
  SortAsc,
  SortDesc,
  Calendar,
  PoundSterling,
  User
} from "lucide-react";
import { DatePicker } from "@/components/ui/date-picker";
import type { FineWithDetails, User as UserType, FineSubcategory } from "@shared/schema";

interface FineFiltersProps {
  fines: FineWithDetails[];
  onFilteredFinesChange: (filteredFines: FineWithDetails[]) => void;
  selectedFines?: string[];
  onSelectedFinesChange?: (selectedFines: string[]) => void;
  onShowBulkPaymentModal?: (fines: FineWithDetails[]) => void;
}

export interface FilterOptions {
  searchTerm: string;
  paymentStatus: 'all' | 'paid' | 'unpaid';
  selectedPlayers: string[];
  selectedSubcategories: string[];
  amountRange: { min: number | null; max: number | null };
  dateRange: { from: Date | null; to: Date | null };
  sortBy: 'date' | 'amount' | 'player' | 'category';
  sortOrder: 'asc' | 'desc';
}

const defaultFilters: FilterOptions = {
  searchTerm: '',
  paymentStatus: 'all',
  selectedPlayers: [],
  selectedSubcategories: [],
  amountRange: { min: null, max: null },
  dateRange: { from: null, to: null },
  sortBy: 'date',
  sortOrder: 'desc',
};

export default function FineFilters({ 
  fines, 
  onFilteredFinesChange,
  selectedFines = [],
  onSelectedFinesChange,
  onShowBulkPaymentModal
}: FineFiltersProps) {
  const [filters, setFilters] = useState<FilterOptions>(defaultFilters);
  const [isExpanded, setIsExpanded] = useState(false);
  const [playerSearch, setPlayerSearch] = useState("");

  const { data: teamMembers = [] } = useQuery<UserType[]>({
    queryKey: ['/api/admin/team-members'],
  });

  const { data: subcategories = [] } = useQuery<FineSubcategory[]>({
    queryKey: ['/api/admin/subcategories'],
  });

  // Calculate category counts for all fines (before filtering)
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    fines.forEach(fine => {
      counts[fine.subcategoryId] = (counts[fine.subcategoryId] || 0) + 1;
    });
    return counts;
  }, [fines]);

  // Filter team members by player search query (nickname, first name, surname)
  const filteredTeamMembers = useMemo(() => {
    const q = playerSearch.toLowerCase().trim();
    if (!q) return teamMembers;
    return teamMembers.filter(p => {
      const first = (p.firstName || "").toLowerCase();
      const last = (p.lastName || "").toLowerCase();
      const nick = (p.nickname || "").toLowerCase();
      return first.includes(q) || last.includes(q) || `${first} ${last}`.includes(q) || nick.includes(q);
    });
  }, [teamMembers, playerSearch]);

  // Apply filters whenever filters or fines change
  useEffect(() => {
    let filtered = [...fines];

    // Search filter
    if (filters.searchTerm) {
      const searchLower = filters.searchTerm.toLowerCase();
      filtered = filtered.filter(fine =>
        fine.player.firstName?.toLowerCase().includes(searchLower) ||
        fine.player.lastName?.toLowerCase().includes(searchLower) ||
        fine.player.nickname?.toLowerCase().includes(searchLower) ||
        fine.player.email?.toLowerCase().includes(searchLower) ||
        fine.subcategory.name.toLowerCase().includes(searchLower) ||
        fine.description?.toLowerCase().includes(searchLower)
      );
    }

    // Payment status filter
    if (filters.paymentStatus !== 'all') {
      filtered = filtered.filter(fine => 
        filters.paymentStatus === 'paid' ? fine.isPaid : !fine.isPaid
      );
    }

    // Player filter
    if (filters.selectedPlayers.length > 0) {
      filtered = filtered.filter(fine => 
        filters.selectedPlayers.includes(fine.playerId)
      );
    }

    // Subcategory filter
    if (filters.selectedSubcategories.length > 0) {
      filtered = filtered.filter(fine => 
        filters.selectedSubcategories.includes(fine.subcategoryId)
      );
    }

    // Amount range filter
    if (filters.amountRange.min !== null || filters.amountRange.max !== null) {
      filtered = filtered.filter(fine => {
        const amount = parseFloat(fine.amount);
        if (filters.amountRange.min !== null && amount < filters.amountRange.min) return false;
        if (filters.amountRange.max !== null && amount > filters.amountRange.max) return false;
        return true;
      });
    }

    // Date range filter
    if (filters.dateRange.from || filters.dateRange.to) {
      filtered = filtered.filter(fine => {
        const fineDate = new Date(fine.createdAt);
        if (filters.dateRange.from && fineDate < filters.dateRange.from) return false;
        if (filters.dateRange.to && fineDate > filters.dateRange.to) return false;
        return true;
      });
    }

    // Sorting
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (filters.sortBy) {
        case 'date':
          aValue = new Date(a.createdAt);
          bValue = new Date(b.createdAt);
          break;
        case 'amount':
          aValue = parseFloat(a.amount);
          bValue = parseFloat(b.amount);
          break;
        case 'player':
          aValue = `${a.player.firstName} ${a.player.lastName}`.toLowerCase();
          bValue = `${b.player.firstName} ${b.player.lastName}`.toLowerCase();
          break;
        case 'category':
          aValue = a.subcategory.name.toLowerCase();
          bValue = b.subcategory.name.toLowerCase();
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return filters.sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return filters.sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    onFilteredFinesChange(filtered);
  }, [filters, fines, onFilteredFinesChange]);

  const updateFilters = (updates: Partial<FilterOptions>) => {
    setFilters(prev => ({ ...prev, ...updates }));
  };

  const clearFilters = () => {
    setFilters(defaultFilters);
  };

  const togglePlayerSelection = (playerId: string) => {
    updateFilters({
      selectedPlayers: filters.selectedPlayers.includes(playerId)
        ? filters.selectedPlayers.filter(id => id !== playerId)
        : [...filters.selectedPlayers, playerId]
    });
  };

  const toggleSubcategorySelection = (subcategoryId: string) => {
    updateFilters({
      selectedSubcategories: filters.selectedSubcategories.includes(subcategoryId)
        ? filters.selectedSubcategories.filter(id => id !== subcategoryId)
        : [...filters.selectedSubcategories, subcategoryId]
    });
  };

  const activeFilterCount = [
    filters.searchTerm ? 1 : 0,
    filters.paymentStatus !== 'all' ? 1 : 0,
    filters.selectedPlayers.length,
    filters.selectedSubcategories.length,
    (filters.amountRange.min !== null || filters.amountRange.max !== null) ? 1 : 0,
    (filters.dateRange.from || filters.dateRange.to) ? 1 : 0,
  ].reduce((sum, count) => sum + count, 0);

  return (
    <Card className="mb-4">
      <CardContent className="p-4">
        {/* Quick Search and Toggle */}
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Search fines..."
              value={filters.searchTerm}
              onChange={(e) => updateFilters({ searchTerm: e.target.value })}
              className="pl-10"
            />
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex items-center gap-2"
            >
              <Filter className="w-4 h-4" />
              Advanced Filters
              {activeFilterCount > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {activeFilterCount}
                </Badge>
              )}
              {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </Button>

            {activeFilterCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="text-slate-600 hover:text-slate-900"
              >
                <X className="w-4 h-4" />
                Clear
              </Button>
            )}
          </div>
        </div>

        {/* Advanced Filters */}
        <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
          <CollapsibleContent>
            <div className="space-y-4 border-t pt-4">
              {/* Status and Sorting Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-2 block">Payment Status</label>
                  <Select value={filters.paymentStatus} onValueChange={(value: any) => updateFilters({ paymentStatus: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Fines</SelectItem>
                      <SelectItem value="unpaid">Unpaid Only</SelectItem>
                      <SelectItem value="paid">Paid Only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-700 mb-2 block">Sort By</label>
                  <Select value={filters.sortBy} onValueChange={(value: any) => updateFilters({ sortBy: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="date">Date</SelectItem>
                      <SelectItem value="amount">Amount</SelectItem>
                      <SelectItem value="player">Player</SelectItem>
                      <SelectItem value="category">Category</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-700 mb-2 block">Order</label>
                  <Button
                    variant="outline"
                    className="w-full justify-between"
                    onClick={() => updateFilters({ sortOrder: filters.sortOrder === 'asc' ? 'desc' : 'asc' })}
                  >
                    {filters.sortOrder === 'asc' ? (
                      <>Ascending <SortAsc className="w-4 h-4" /></>
                    ) : (
                      <>Descending <SortDesc className="w-4 h-4" /></>
                    )}
                  </Button>
                </div>
              </div>

              {/* Amount Range */}
              <div>
                <label className="text-sm font-medium text-slate-700 mb-2 block flex items-center gap-2">
                  <PoundSterling className="w-4 h-4" />
                  Amount Range
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    type="number"
                    placeholder="Min amount"
                    value={filters.amountRange.min?.toString() || ''}
                    onChange={(e) => updateFilters({ 
                      amountRange: { 
                        ...filters.amountRange, 
                        min: e.target.value ? parseFloat(e.target.value) : null 
                      }
                    })}
                  />
                  <Input
                    type="number"
                    placeholder="Max amount"
                    value={filters.amountRange.max?.toString() || ''}
                    onChange={(e) => updateFilters({ 
                      amountRange: { 
                        ...filters.amountRange, 
                        max: e.target.value ? parseFloat(e.target.value) : null 
                      }
                    })}
                  />
                </div>
              </div>

              {/* Players Filter */}
              {teamMembers.length > 0 && (
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-2 block flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Players ({filters.selectedPlayers.length} selected)
                  </label>
                  <div className="relative mb-2">
                    <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-slate-400" />
                    <Input
                      placeholder="Search by name or nickname..."
                      value={playerSearch}
                      onChange={(e) => setPlayerSearch(e.target.value)}
                      className="pl-8 h-8 text-xs"
                    />
                  </div>
                  <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto p-2 border rounded-lg">
                    {filteredTeamMembers.length === 0 ? (
                      <span className="text-xs text-slate-400 p-1">No players found</span>
                    ) : filteredTeamMembers.map((player) => (
                      <Button
                        key={player.id}
                        variant={filters.selectedPlayers.includes(player.id) ? "default" : "outline"}
                        size="sm"
                        onClick={() => togglePlayerSelection(player.id)}
                        className="text-xs"
                      >
                        {player.nickname || `${player.firstName} ${player.lastName}`}
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              {/* Fine Categories Filter with Counts */}
              {subcategories.length > 0 && (
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-2 block flex items-center gap-2">
                    <Tags className="w-4 h-4" />
                    Fine Types ({filters.selectedSubcategories.length} selected)
                  </label>
                  <div className="flex flex-wrap gap-2 max-h-40 sm:max-h-32 overflow-y-auto p-2 border rounded-lg">
                    {subcategories.map((subcategory) => {
                      const count = categoryCounts[subcategory.id] || 0;
                      return (
                        <Button
                          key={subcategory.id}
                          variant={filters.selectedSubcategories.includes(subcategory.id) ? "default" : "outline"}
                          size="sm"
                          onClick={() => toggleSubcategorySelection(subcategory.id)}
                          className="text-xs flex items-center gap-1 h-auto py-2 px-3"
                        >
                          <span className="truncate">{subcategory.name}</span>
                          <Badge 
                            variant={filters.selectedSubcategories.includes(subcategory.id) ? "outline" : "secondary"} 
                            className="text-xs px-1.5 py-0.5 min-w-[1.5rem] justify-center"
                          >
                            {count}
                          </Badge>
                        </Button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Results Summary */}
        <div className="mt-4 pt-4 border-t flex items-center justify-between text-sm text-slate-600">
          <span>Showing {fines.length} fines</span>
          {activeFilterCount > 0 && (
            <span className="flex items-center gap-2">
              <Filter className="w-4 h-4" />
              {activeFilterCount} filter{activeFilterCount !== 1 ? 's' : ''} applied
            </span>
          )}
        </div>

        {/* Bulk Actions */}
        {selectedFines.length > 0 && onSelectedFinesChange && (
          <BulkActionsBar
            selectedFines={fines.filter(f => selectedFines.includes(f.id))}
            onClearSelection={() => onSelectedFinesChange([])}
            onShowPaymentModal={onShowBulkPaymentModal || (() => {})}
          />
        )}
      </CardContent>
    </Card>
  );
}