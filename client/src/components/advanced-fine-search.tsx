import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DatePickerWithRange } from "@/components/ui/date-picker-with-range";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { 
  Search, 
  Filter, 
  X, 
  Calendar,
  Users,
  Tags,
  DollarSign,
  TrendingDown,
  TrendingUp,
  RotateCcw
} from "lucide-react";
import { DateRange } from "react-day-picker";
import { addDays } from "date-fns";

export interface AdvancedSearchFilters {
  searchText: string;
  dateRange?: DateRange;
  categories: string[];
  subcategories: string[];
  players: string[];
  amountRange: {
    min?: number;
    max?: number;
  };
  status: 'all' | 'paid' | 'unpaid';
  sortBy: 'date' | 'amount' | 'player' | 'category';
  sortOrder: 'asc' | 'desc';
  showOnlyMyFines: boolean;
}

interface AdvancedFineSearchProps {
  filters: AdvancedSearchFilters;
  onFiltersChange: (filters: AdvancedSearchFilters) => void;
  availableCategories: Array<{ id: string; name: string; subcategories?: Array<{ id: string; name: string }> }>;
  availablePlayers: Array<{ id: string; name: string }>;
  isLoading?: boolean;
}

export function AdvancedFineSearch({ 
  filters, 
  onFiltersChange, 
  availableCategories, 
  availablePlayers,
  isLoading = false 
}: AdvancedFineSearchProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [tempFilters, setTempFilters] = useState(filters);

  useEffect(() => {
    setTempFilters(filters);
  }, [filters]);

  const applyFilters = () => {
    onFiltersChange(tempFilters);
    setIsExpanded(false);
  };

  const resetFilters = () => {
    const defaultFilters: AdvancedSearchFilters = {
      searchText: '',
      categories: [],
      subcategories: [],
      players: [],
      amountRange: {},
      status: 'all',
      sortBy: 'date',
      sortOrder: 'desc',
      showOnlyMyFines: false
    };
    setTempFilters(defaultFilters);
    onFiltersChange(defaultFilters);
  };

  const activeFiltersCount = () => {
    let count = 0;
    if (filters.searchText) count++;
    if (filters.dateRange?.from || filters.dateRange?.to) count++;
    if (filters.categories.length > 0) count++;
    if (filters.subcategories.length > 0) count++;
    if (filters.players.length > 0) count++;
    if (filters.amountRange.min || filters.amountRange.max) count++;
    if (filters.status !== 'all') count++;
    if (filters.showOnlyMyFines) count++;
    return count;
  };

  const getPresetDateRanges = () => [
    {
      label: "Today",
      value: { from: new Date(), to: new Date() }
    },
    {
      label: "This Week",
      value: { from: addDays(new Date(), -7), to: new Date() }
    },
    {
      label: "This Month",
      value: { from: addDays(new Date(), -30), to: new Date() }
    },
    {
      label: "Last 3 Months",
      value: { from: addDays(new Date(), -90), to: new Date() }
    }
  ];

  return (
    <Card className="card-enhanced">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Search className="w-5 h-5" />
            Advanced Search & Filters
            {activeFiltersCount() > 0 && (
              <Badge variant="secondary" className="ml-2">
                {activeFiltersCount()} active
              </Badge>
            )}
          </CardTitle>
          <div className="flex items-center gap-2">
            {activeFiltersCount() > 0 && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={resetFilters}
                className="text-muted-foreground hover:text-foreground"
              >
                <RotateCcw className="w-4 h-4 mr-1" />
                Reset
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              <Filter className="w-4 h-4 mr-1" />
              {isExpanded ? 'Collapse' : 'Expand'}
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Quick Search */}
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search fines by player name, reason, or description..."
            value={tempFilters.searchText}
            onChange={(e) => setTempFilters(prev => ({ ...prev, searchText: e.target.value }))}
            onKeyPress={(e) => e.key === 'Enter' && applyFilters()}
            className="pl-10 pr-4 h-10"
          />
          {tempFilters.searchText && (
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-1 top-1 h-8 w-8 p-0"
              onClick={() => setTempFilters(prev => ({ ...prev, searchText: '' }))}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {isExpanded && (
          <>
            <Separator />
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Date Range */}
              <div className="space-y-3">
                <Label className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Date Range
                </Label>
                <DatePickerWithRange 
                  date={tempFilters.dateRange}
                  onDateChange={(range: DateRange | undefined) => setTempFilters(prev => ({ ...prev, dateRange: range }))}
                />
                <div className="flex flex-wrap gap-2 mt-2">
                  {getPresetDateRanges().map((preset) => (
                    <Button
                      key={preset.label}
                      variant="outline"
                      size="sm"
                      onClick={() => setTempFilters(prev => ({ ...prev, dateRange: preset.value }))}
                      className="text-xs"
                    >
                      {preset.label}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Amount Range */}
              <div className="space-y-3">
                <Label className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4" />
                  Amount Range
                </Label>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Min (£)</Label>
                    <Input
                      type="number"
                      placeholder="0.00"
                      step="0.01"
                      min="0"
                      value={tempFilters.amountRange.min || ''}
                      onChange={(e) => setTempFilters(prev => ({ 
                        ...prev, 
                        amountRange: { ...prev.amountRange, min: e.target.value ? parseFloat(e.target.value) : undefined }
                      }))}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Max (£)</Label>
                    <Input
                      type="number"
                      placeholder="999.99"
                      step="0.01"
                      min="0"
                      value={tempFilters.amountRange.max || ''}
                      onChange={(e) => setTempFilters(prev => ({ 
                        ...prev, 
                        amountRange: { ...prev.amountRange, max: e.target.value ? parseFloat(e.target.value) : undefined }
                      }))}
                    />
                  </div>
                </div>
              </div>

              {/* Categories */}
              <div className="space-y-3">
                <Label className="flex items-center gap-2">
                  <Tags className="w-4 h-4" />
                  Categories
                </Label>
                <Select
                  value=""
                  onValueChange={(categoryId) => {
                    if (!tempFilters.categories.includes(categoryId)) {
                      setTempFilters(prev => ({ 
                        ...prev, 
                        categories: [...prev.categories, categoryId]
                      }));
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Add category filter..." />
                  </SelectTrigger>
                  <SelectContent>
                    {availableCategories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="flex flex-wrap gap-2">
                  {tempFilters.categories.map((categoryId) => {
                    const category = availableCategories.find(c => c.id === categoryId);
                    return category ? (
                      <Badge key={categoryId} variant="secondary" className="gap-1">
                        {category.name}
                        <X 
                          className="w-3 h-3 cursor-pointer" 
                          onClick={() => setTempFilters(prev => ({
                            ...prev,
                            categories: prev.categories.filter(id => id !== categoryId)
                          }))}
                        />
                      </Badge>
                    ) : null;
                  })}
                </div>
              </div>

              {/* Players */}
              <div className="space-y-3">
                <Label className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Players
                </Label>
                <Select
                  value=""
                  onValueChange={(playerId) => {
                    if (!tempFilters.players.includes(playerId)) {
                      setTempFilters(prev => ({ 
                        ...prev, 
                        players: [...prev.players, playerId]
                      }));
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Add player filter..." />
                  </SelectTrigger>
                  <SelectContent>
                    {availablePlayers.map((player) => (
                      <SelectItem key={player.id} value={player.id}>
                        {player.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="flex flex-wrap gap-2">
                  {tempFilters.players.map((playerId) => {
                    const player = availablePlayers.find(p => p.id === playerId);
                    return player ? (
                      <Badge key={playerId} variant="secondary" className="gap-1">
                        {player.name}
                        <X 
                          className="w-3 h-3 cursor-pointer" 
                          onClick={() => setTempFilters(prev => ({
                            ...prev,
                            players: prev.players.filter(id => id !== playerId)
                          }))}
                        />
                      </Badge>
                    ) : null;
                  })}
                </div>
              </div>

              {/* Status & Sorting */}
              <div className="space-y-3">
                <Label>Status & Sorting</Label>
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label className="text-sm text-muted-foreground">Payment Status</Label>
                    <Select
                      value={tempFilters.status}
                      onValueChange={(value: 'all' | 'paid' | 'unpaid') => 
                        setTempFilters(prev => ({ ...prev, status: value }))
                      }
                    >
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
                  
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-2">
                      <Label className="text-sm text-muted-foreground">Sort By</Label>
                      <Select
                        value={tempFilters.sortBy}
                        onValueChange={(value: 'date' | 'amount' | 'player' | 'category') => 
                          setTempFilters(prev => ({ ...prev, sortBy: value }))
                        }
                      >
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
                    
                    <div className="space-y-2">
                      <Label className="text-sm text-muted-foreground">Order</Label>
                      <Button
                        variant="outline"
                        onClick={() => setTempFilters(prev => ({ 
                          ...prev, 
                          sortOrder: prev.sortOrder === 'asc' ? 'desc' : 'asc' 
                        }))}
                        className="w-full justify-center gap-2"
                      >
                        {tempFilters.sortOrder === 'asc' ? (
                          <>
                            <TrendingUp className="w-4 h-4" />
                            Ascending
                          </>
                        ) : (
                          <>
                            <TrendingDown className="w-4 h-4" />
                            Descending
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Additional Options */}
              <div className="space-y-3">
                <Label>Additional Options</Label>
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={tempFilters.showOnlyMyFines}
                    onCheckedChange={(checked) => 
                      setTempFilters(prev => ({ ...prev, showOnlyMyFines: checked }))
                    }
                  />
                  <Label className="text-sm">Show only my fines</Label>
                </div>
              </div>
            </div>

            <Separator />

            <div className="flex justify-end gap-3">
              <Button 
                variant="outline" 
                onClick={() => {
                  setTempFilters(filters);
                  setIsExpanded(false);
                }}
              >
                Cancel
              </Button>
              <Button 
                onClick={applyFilters}
                disabled={isLoading}
                className="btn-enhanced"
              >
                Apply Filters
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

export default AdvancedFineSearch;