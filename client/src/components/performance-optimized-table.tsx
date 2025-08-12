import { useState, useRef, useMemo, useCallback } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  ChevronUp, 
  ChevronDown, 
  Search, 
  Filter,
  MoreHorizontal,
  ArrowUpDown
} from "lucide-react";
import { useVirtualScroll, useDebounce, useIntersectionObserver } from "@/lib/performance";
import { TableSkeleton } from "@/components/ui/loading-skeleton";

interface Column<T> {
  key: keyof T;
  header: string;
  sortable?: boolean;
  filterable?: boolean;
  width?: string;
  render?: (item: T, value: any) => React.ReactNode;
}

interface PerformanceTableProps<T> {
  data: T[];
  columns: Column<T>[];
  loading?: boolean;
  searchableColumns?: (keyof T)[];
  onRowClick?: (item: T) => void;
  onSelectionChange?: (selectedItems: T[]) => void;
  itemHeight?: number;
  containerHeight?: number;
  enableVirtualScrolling?: boolean;
}

export function PerformanceOptimizedTable<T extends Record<string, any>>({
  data,
  columns,
  loading = false,
  searchableColumns = [],
  onRowClick,
  onSelectionChange,
  itemHeight = 60,
  containerHeight = 400,
  enableVirtualScrolling = false
}: PerformanceTableProps<T>) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortConfig, setSortConfig] = useState<{
    key: keyof T | null;
    direction: 'asc' | 'desc';
  }>({ key: null, direction: 'asc' });
  const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set());
  const [columnFilters, setColumnFilters] = useState<Record<string, string>>({});

  const tableRef = useRef<HTMLDivElement>(null);
  const { isVisible } = useIntersectionObserver(tableRef);
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  // Memoized filtered and sorted data
  const processedData = useMemo(() => {
    let filtered = [...data];

    // Apply search filter
    if (debouncedSearchQuery && searchableColumns.length > 0) {
      const query = debouncedSearchQuery.toLowerCase();
      filtered = filtered.filter(item =>
        searchableColumns.some(column =>
          String(item[column]).toLowerCase().includes(query)
        )
      );
    }

    // Apply column filters
    Object.entries(columnFilters).forEach(([column, filterValue]) => {
      if (filterValue) {
        filtered = filtered.filter(item =>
          String(item[column]).toLowerCase().includes(filterValue.toLowerCase())
        );
      }
    });

    // Apply sorting
    if (sortConfig.key) {
      filtered.sort((a, b) => {
        const aValue = a[sortConfig.key!];
        const bValue = b[sortConfig.key!];
        
        if (aValue < bValue) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }

    return filtered;
  }, [data, debouncedSearchQuery, searchableColumns, columnFilters, sortConfig]);

  // Virtual scrolling setup
  const virtualScrollData = useVirtualScroll({
    items: processedData,
    itemHeight,
    containerHeight,
  });

  const displayData = enableVirtualScrolling ? virtualScrollData.items : processedData;

  // Event handlers
  const handleSort = useCallback((key: keyof T) => {
    setSortConfig(current => ({
      key,
      direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc'
    }));
  }, []);

  const handleSelectAll = useCallback((checked: boolean) => {
    if (checked) {
      setSelectedItems(new Set(processedData.map((_, index) => index)));
    } else {
      setSelectedItems(new Set());
    }
  }, [processedData]);

  const handleSelectItem = useCallback((index: number, checked: boolean) => {
    setSelectedItems(current => {
      const updated = new Set(current);
      if (checked) {
        updated.add(index);
      } else {
        updated.delete(index);
      }
      return updated;
    });
  }, []);

  const handleColumnFilter = useCallback((column: string, value: string) => {
    setColumnFilters(current => ({
      ...current,
      [column]: value
    }));
  }, []);

  // Update parent with selection changes
  useMemo(() => {
    if (onSelectionChange) {
      const selected = Array.from(selectedItems).map(index => processedData[index]);
      onSelectionChange(selected);
    }
  }, [selectedItems, processedData, onSelectionChange]);

  if (loading) {
    return <TableSkeleton rows={10} />;
  }

  const renderSortIcon = (column: Column<T>) => {
    if (!column.sortable) return null;
    
    if (sortConfig.key === column.key) {
      return sortConfig.direction === 'asc' ? 
        <ChevronUp className="w-4 h-4" /> : 
        <ChevronDown className="w-4 h-4" />;
    }
    
    return <ArrowUpDown className="w-4 h-4 opacity-50" />;
  };

  return (
    <div ref={tableRef} className="space-y-4">
      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={`Search ${searchableColumns.length} columns...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary">
            {processedData.length} of {data.length} items
          </Badge>
          {selectedItems.size > 0 && (
            <Badge variant="default">
              {selectedItems.size} selected
            </Badge>
          )}
        </div>
      </div>

      {/* Table */}
      <div 
        className="border rounded-lg"
        style={enableVirtualScrolling ? {
          height: containerHeight,
          overflow: 'auto'
        } : {}}
        onScroll={enableVirtualScrolling ? virtualScrollData.onScroll : undefined}
      >
        <Table>
          <TableHeader className="sticky top-0 bg-background z-10">
            <TableRow>
              {onSelectionChange && (
                <TableHead className="w-12">
                  <Checkbox
                    checked={selectedItems.size === processedData.length && processedData.length > 0}
                    onCheckedChange={handleSelectAll}
                  />
                </TableHead>
              )}
              {columns.map((column) => (
                <TableHead 
                  key={String(column.key)}
                  style={column.width ? { width: column.width } : {}}
                  className={column.sortable ? "cursor-pointer select-none" : ""}
                  onClick={column.sortable ? () => handleSort(column.key) : undefined}
                >
                  <div className="flex items-center justify-between">
                    <span>{column.header}</span>
                    <div className="flex items-center gap-1">
                      {renderSortIcon(column)}
                      {column.filterable && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                        >
                          <Filter className="w-3 h-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                </TableHead>
              ))}
            </TableRow>
            
            {/* Filter row */}
            {columns.some(col => col.filterable) && (
              <TableRow className="border-b">
                {onSelectionChange && <TableHead className="w-12" />}
                {columns.map((column) => (
                  <TableHead key={`filter-${String(column.key)}`}>
                    {column.filterable && (
                      <Input
                        placeholder={`Filter ${column.header.toLowerCase()}...`}
                        value={columnFilters[String(column.key)] || ''}
                        onChange={(e) => handleColumnFilter(String(column.key), e.target.value)}
                        className="h-8"
                      />
                    )}
                  </TableHead>
                ))}
              </TableRow>
            )}
          </TableHeader>
          
          <TableBody>
            {enableVirtualScrolling && (
              <TableRow>
                <TableCell 
                  colSpan={columns.length + (onSelectionChange ? 1 : 0)}
                  style={{ height: virtualScrollData.offsetY }}
                  className="p-0"
                />
              </TableRow>
            )}
            
            {displayData.map((item, displayIndex) => {
              const actualIndex = enableVirtualScrolling ? 
                virtualScrollData.startIndex + displayIndex : displayIndex;
              const isSelected = selectedItems.has(actualIndex);
              
              return (
                <TableRow 
                  key={actualIndex}
                  className={`
                    ${isSelected ? 'bg-muted/50' : ''} 
                    ${onRowClick ? 'cursor-pointer hover:bg-muted/30' : ''}
                  `}
                  onClick={onRowClick ? () => onRowClick(item) : undefined}
                >
                  {onSelectionChange && (
                    <TableCell className="w-12">
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={(checked) => handleSelectItem(actualIndex, checked)}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </TableCell>
                  )}
                  {columns.map((column) => (
                    <TableCell key={String(column.key)}>
                      {column.render ? 
                        column.render(item, item[column.key]) : 
                        String(item[column.key] || '-')
                      }
                    </TableCell>
                  ))}
                </TableRow>
              );
            })}
            
            {enableVirtualScrolling && (
              <TableRow>
                <TableCell 
                  colSpan={columns.length + (onSelectionChange ? 1 : 0)}
                  style={{ 
                    height: virtualScrollData.totalHeight - virtualScrollData.offsetY - 
                            (displayData.length * itemHeight) 
                  }}
                  className="p-0"
                />
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      
      {/* Empty state */}
      {processedData.length === 0 && !loading && (
        <div className="text-center py-12 text-muted-foreground">
          {searchQuery || Object.values(columnFilters).some(v => v) ? 
            'No items match your filters' : 
            'No data available'
          }
        </div>
      )}
    </div>
  );
}

export default PerformanceOptimizedTable;