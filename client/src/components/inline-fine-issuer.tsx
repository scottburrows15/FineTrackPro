import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { getDisplayName } from "@/lib/userUtils";
import { formatCurrency } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Users, 
  UserCheck, 
  UserX, 
  Search,
  CheckSquare,
  Square,
  Gavel,
  PoundSterling
} from "lucide-react";
import type { FineCategory, FineSubcategory, User } from "@shared/schema";

export default function InlineFineIssuer() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [playerSearchTerm, setPlayerSearchTerm] = useState("");
  const [isBulkMode, setIsBulkMode] = useState(false);

  const [formData, setFormData] = useState({
    selectedPlayerIds: [] as string[],
    categoryId: "",
    subcategoryId: "",
    amount: "",
    description: "",
    sendNotification: true,
  });

  // Fetch data
  const { data: categories = [], isLoading: categoriesLoading } = useQuery<FineCategory[]>({
    queryKey: ["/api/categories"],
  });

  const { data: subcategories = [], isLoading: subcategoriesLoading } = useQuery<FineSubcategory[]>({
    queryKey: ["/api/subcategories", formData.categoryId],
    enabled: !!formData.categoryId,
  });

  const { data: teamMembers = [], isLoading: membersLoading } = useQuery<User[]>({
    queryKey: ["/api/admin/team-members"],
  });

  // Filter players based on search term
  const filteredPlayers = teamMembers.filter(player => {
    if (!playerSearchTerm) return true;
    const searchLower = playerSearchTerm.toLowerCase().trim();
    const firstName = (player.firstName || '').toLowerCase();
    const lastName = (player.lastName || '').toLowerCase();
    const fullName = `${firstName} ${lastName}`;
    const position = (player.position || '').toLowerCase();
    
    return firstName.includes(searchLower) || 
           lastName.includes(searchLower) || 
           fullName.includes(searchLower) || 
           position.includes(searchLower) ||
           (firstName[0] + lastName[0]).includes(searchLower);
  });

  // Update subcategory when category changes
  useEffect(() => {
    if (formData.categoryId) {
      const category = categories.find(c => c.id === formData.categoryId);
      if (category && subcategories.length > 0) {
        const firstSubcat = subcategories[0];
        setFormData(prev => ({
          ...prev,
          subcategoryId: firstSubcat.id,
          amount: firstSubcat.defaultAmount.toString(),
        }));
      }
    }
  }, [formData.categoryId, subcategories, categories]);

  // Update amount when subcategory changes
  useEffect(() => {
    if (formData.subcategoryId) {
      const subcat = subcategories.find(s => s.id === formData.subcategoryId);
      if (subcat) {
        setFormData(prev => ({
          ...prev,
          amount: subcat.defaultAmount.toString(),
        }));
      }
    }
  }, [formData.subcategoryId, subcategories]);

  // Mutation
  const mutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("POST", "/api/fines/bulk", {
        playerIds: data.selectedPlayerIds,
        subcategoryId: data.subcategoryId,
        amount: data.amount,
        description: data.description,
      });
    },
    onSuccess: () => {
      const playerCount = formData.selectedPlayerIds.length;
      toast({
        title: `Fine${playerCount > 1 ? 's' : ''} Issued`,
        description: `Successfully issued ${playerCount > 1 ? `${playerCount} fines` : 'fine'}.`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/fines"] });
      queryClient.invalidateQueries({ queryKey: ["/api/fines/team"] });
      queryClient.invalidateQueries({ queryKey: ["/api/fines/my"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/unpaid-fines"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats/team"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats/player"] });
      queryClient.invalidateQueries({ queryKey: ["/api/analytics/team"] });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      resetForm();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to issue fine(s)",
        variant: "destructive",
      });
    },
  });
  
  const resetForm = () => {
    setFormData({
      selectedPlayerIds: [],
      categoryId: "",
      subcategoryId: "",
      amount: "",
      description: "",
      sendNotification: true,
    });
    setPlayerSearchTerm("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.selectedPlayerIds.length) {
      toast({
        title: "No Player Selected",
        description: "Please select at least one player",
        variant: "destructive",
      });
      return;
    }

    if (!formData.subcategoryId) {
      toast({
        title: "Validation Error",
        description: "Please select a fine category",
        variant: "destructive",
      });
      return;
    }

    mutation.mutate(formData);
  };

  const togglePlayer = (playerId: string) => {
    if (isBulkMode) {
      setFormData(prev => ({
        ...prev,
        selectedPlayerIds: prev.selectedPlayerIds.includes(playerId)
          ? prev.selectedPlayerIds.filter(id => id !== playerId)
          : [...prev.selectedPlayerIds, playerId]
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        selectedPlayerIds: [playerId]
      }));
    }
  };

  const selectAllPlayers = () => {
    setFormData(prev => ({
      ...prev,
      selectedPlayerIds: filteredPlayers.map(p => p.id)
    }));
  };

  const clearSelection = () => {
    setFormData(prev => ({
      ...prev,
      selectedPlayerIds: []
    }));
  };

  const selectedSubcategory = subcategories.find(s => s.id === formData.subcategoryId);

  return (
    <Card className="bg-white dark:bg-slate-800 border-border shadow-md">
      <CardContent className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Fine Mode Switcher */}
          <div className="border-b border-border">
            <div className="flex items-center gap-10 px-2">
              <button
                type="button"
                onClick={() => {
                  setIsBulkMode(false);
                  // Reset to single selection when switching to single mode
                  setFormData(prev => ({
                    ...prev,
                    selectedPlayerIds: prev.selectedPlayerIds.length > 0 ? [prev.selectedPlayerIds[0]] : []
                  }));
                }}
                className="relative pb-3 transition-colors"
                data-testid="switcher-single-fine"
              >
                <div className="flex items-center gap-0">
                  <Gavel className={`h-8 w-8 ${!isBulkMode ? 'text-red-600 dark:text-red-400' : 'text-slate-400'}`} />
                  <span className={`text-base font-semibold ${
                    !isBulkMode 
                      ? 'text-red-600 dark:text-red-400' 
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                  }`}>
                    Single Fine
                  </span>
                </div>
                {!isBulkMode && (
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-red-600 dark:bg-red-400 rounded-t-full animate-in fade-in slide-in-from-bottom-1 duration-200" />
                )}
              </button>
              <button
                type="button"
                onClick={() => setIsBulkMode(true)}
                className="relative pb-3 transition-colors"
                data-testid="switcher-bulk-fines"
              >
                <div className="flex items-center gap-0">
                  <Users className={`h-8 w-8 ${isBulkMode ? 'text-yellow-500 dark:text-yellow-400' : 'text-slate-400'}`} />
                  <span className={`text-base font-semibold ${
                    isBulkMode 
                      ? 'text-yellow-500 dark:text-yellow-400' 
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                  }`}>
                    Bulk Fines
                  </span>
                </div>
                {isBulkMode && (
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-yellow-400 dark:bg-yellow-400 rounded-t-full animate-in fade-in slide-in-from-bottom-1 duration-200" />
                )}
              </button>
            </div>
          </div>

          {/* Player Selection */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">
              {isBulkMode ? "Select Players" : "Select Player"}
              <span className="text-red-500 ml-1">*</span>
            </Label>
            
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search players by name or position..."
                value={playerSearchTerm}
                onChange={(e) => setPlayerSearchTerm(e.target.value)}
                className="pl-10"
                data-testid="input-player-search"
              />
            </div>

            {/* Bulk Mode Actions */}
            {isBulkMode && (
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={selectAllPlayers}
                  disabled={filteredPlayers.length === 0}
                  data-testid="button-select-all"
                >
                  <CheckSquare className="h-4 w-4 mr-2" />
                  Select All
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={clearSelection}
                  disabled={formData.selectedPlayerIds.length === 0}
                  data-testid="button-clear-selection"
                >
                  <Square className="h-4 w-4 mr-2" />
              Clear All
                </Button>
                {formData.selectedPlayerIds.length > 0 && (
                  <Badge variant="secondary" className="ml-auto">
                    {formData.selectedPlayerIds.length} selected
                  </Badge>
                )}
              </div>
            )}

            {/* Player List */}
            <ScrollArea className="h-[200px] border rounded-lg bg-slate-50 dark:bg-slate-900/50">
              <div className="p-2 space-y-1">
                {membersLoading ? (
                  <p className="text-sm text-muted-foreground p-4">Loading players...</p>
                ) : filteredPlayers.length === 0 ? (
                  <p className="text-sm text-muted-foreground p-4">No players found</p>
                ) : (
                  filteredPlayers.map((player) => {
                    const isSelected = formData.selectedPlayerIds.includes(player.id);
                    return (
                      <button
                        key={player.id}
                        type="button"
                        onClick={() => togglePlayer(player.id)}
                        className={`w-full p-3 rounded-lg text-left transition-colors ${
                          isSelected 
                            ? 'bg-blue-100 dark:bg-blue-900/30 border-2 border-blue-500' 
                            : 'bg-white dark:bg-slate-800 border border-border hover:bg-slate-100 dark:hover:bg-slate-700'
                        }`}
                        data-testid={`player-option-${player.id}`}
                      >
                        <div className="flex items-center gap-3">
                          {isSelected ? (
                            <UserCheck className="h-5 w-5 text-blue-500 flex-shrink-0" />
                          ) : (
                            <UserX className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{getDisplayName(player)}</p>
                            {player.position && (
                              <p className="text-sm text-muted-foreground truncate">{player.position}</p>
                            )}
                          </div>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </ScrollArea>
          </div>

          {/* Fine Category */}
          <div className="space-y-3">
            <Label htmlFor="category" className="text-base font-semibold">
              Fine Category
              <span className="text-red-500 ml-1">*</span>
            </Label>
            <Select
              value={formData.categoryId}
              onValueChange={(value) => setFormData(prev => ({ ...prev, categoryId: value, subcategoryId: "" }))}
              disabled={categoriesLoading}
            >
              <SelectTrigger id="category" data-testid="select-category">
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Subcategory */}
          {formData.categoryId && (
            <div className="space-y-3">
              <Label htmlFor="subcategory" className="text-base font-semibold">
                Fine Type
                <span className="text-red-500 ml-1">*</span>
              </Label>
              <Select
                value={formData.subcategoryId}
                onValueChange={(value) => setFormData(prev => ({ ...prev, subcategoryId: value }))}
                disabled={subcategoriesLoading}
              >
                <SelectTrigger id="subcategory" data-testid="select-subcategory">
                  <SelectValue placeholder="Select fine type" />
                </SelectTrigger>
                <SelectContent>
                  {subcategories.map((sub) => (
                    <SelectItem key={sub.id} value={sub.id}>
                      {sub.name} - {formatCurrency(sub.defaultAmount)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Amount */}
          {selectedSubcategory && (
            <div className="space-y-3">
              <Label htmlFor="amount" className="text-base font-semibold flex items-center gap-2">
                <PoundSterling className="h-4 w-4" />
                Amount (£)
                <span className="text-red-500 ml-1">*</span>
              </Label>
              <div className="flex items-center gap-3">
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.amount}
                  onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                  className="flex-1"
                  data-testid="input-amount"
                />
                <Badge variant="outline" className="whitespace-nowrap">
                  Default: {formatCurrency(selectedSubcategory.defaultAmount)}
                </Badge>
              </div>
            </div>
          )}

          {/* Description */}
          <div className="space-y-3">
            <Label htmlFor="description" className="text-base font-semibold">
              Description / Notes (Optional)
            </Label>
            <Textarea
              id="description"
              placeholder="Add any additional details about this fine..."
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              rows={3}
              data-testid="input-description"
            />
          </div>

          {/* Submit Button */}
          <div className="pt-4 border-t">
            <Button
              type="submit"
              size="lg"
              className="w-full bg-red-600 hover:bg-red-700 text-white"
              disabled={mutation.isPending || !formData.selectedPlayerIds.length || !formData.subcategoryId}
              data-testid="button-submit-fine"
            >
              <Gavel className="mr-2 h-5 w-5" />
              {mutation.isPending 
                ? "Issuing Fine..." 
                : `Issue Fine${formData.selectedPlayerIds.length > 1 ? 's' : ''} ${formData.selectedPlayerIds.length > 1 ? `(${formData.selectedPlayerIds.length} players)` : ''}`
              }
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
