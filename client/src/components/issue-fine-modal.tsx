import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { formatCurrency, getDisplayName } from "@/lib/userUtils";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { 
  Users, 
  UserCheck, 
  UserX, 
  Plus,
  Search,
  Check
} from "lucide-react";
import type { FineCategory, FineSubcategory, User } from "@shared/schema";

interface IssueFineModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function IssueFineModal({ isOpen, onClose }: IssueFineModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [playerSearchTerm, setPlayerSearchTerm] = useState("");

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
    enabled: isOpen,
  });

  const { data: subcategories = [], isLoading: subcategoriesLoading } = useQuery<FineSubcategory[]>({
    queryKey: ["/api/subcategories", formData.categoryId],
    enabled: isOpen && !!formData.categoryId,
  });

  const { data: teamMembers = [], isLoading: membersLoading } = useQuery<User[]>({
    queryKey: ["/api/admin/team-members"],
    enabled: isOpen,
  });

  // Filter players based on search term
  const filteredPlayers = teamMembers.filter(player => {
    if (!playerSearchTerm) return true;
    const searchLower = playerSearchTerm.toLowerCase();
    const fullName = `${player.firstName} ${player.lastName}`.toLowerCase();
    const position = (player.position || '').toLowerCase();
    return fullName.includes(searchLower) || position.includes(searchLower);
  });

  // Unified fine mutation that works for any number of players
  const mutation = useMutation({
    mutationFn: async (data: any) => {
      // Always use bulk endpoint which can handle single or multiple players
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
      // Comprehensive cache invalidation to ensure dashboard totals update immediately
      queryClient.invalidateQueries({ queryKey: ["/api/fines"] });
      queryClient.invalidateQueries({ queryKey: ["/api/fines/team"] });
      queryClient.invalidateQueries({ queryKey: ["/api/fines/my"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/unpaid-fines"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats/team"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats/player"] });
      queryClient.invalidateQueries({ queryKey: ["/api/analytics/team"] });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      onClose();
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
    
    if (formData.selectedPlayerIds.length === 0 || !formData.subcategoryId || !formData.amount) {
      toast({
        title: "Missing Information",
        description: "Please select player(s), subcategory, and amount.",
        variant: "destructive",
      });
      return;
    }

    mutation.mutate(formData);
  };

  const selectedSubcategory = subcategories.find(
    sub => sub.id === formData.subcategoryId
  );

  // Auto-suggest amount when subcategory changes
  const handleSubcategoryChange = (subcategoryId: string) => {
    const subcategory = subcategories.find(sub => sub.id === subcategoryId);
    setFormData(prev => ({
      ...prev,
      subcategoryId,
      amount: subcategory?.defaultAmount || "",
    }));
  };
  
  const handlePlayerToggle = (playerId: string) => {
    setFormData(prev => ({
      ...prev,
      selectedPlayerIds: prev.selectedPlayerIds.includes(playerId)
        ? prev.selectedPlayerIds.filter(id => id !== playerId)
        : [...prev.selectedPlayerIds, playerId]
    }));
  };
  
  const totalCost = formData.selectedPlayerIds.length * parseFloat(formData.amount || '0');
  
  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      resetForm();
    }
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-full max-w-[95vw] sm:max-w-2xl max-h-[95vh] overflow-hidden flex flex-col p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle>Issue New Fine</DialogTitle>
        </DialogHeader>
        
        <div className="overflow-y-auto flex-1 pr-2 -mr-2">
          <form id="issue-fine-form" onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
            {/* Player Selection */}
            <div className="space-y-3 sm:space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <Label className="text-base font-semibold">Players *</Label>
                {formData.selectedPlayerIds.length > 0 && (
                  <Badge variant="secondary" className="px-2 py-1">
                    {formData.selectedPlayerIds.length} selected
                  </Badge>
                )}
              </div>
            </div>

            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
              <Input
                placeholder="Search players by name or position..."
                value={playerSearchTerm}
                onChange={(e) => setPlayerSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Quick Actions for Selection */}
            {filteredPlayers.length > 0 && (
              <div className="flex items-center space-x-2 text-sm">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setFormData(prev => ({ 
                    ...prev, 
                    selectedPlayerIds: filteredPlayers.map(m => m.id) 
                  }))}
                  disabled={formData.selectedPlayerIds.length === filteredPlayers.length}
                >
                  <UserCheck className="w-4 h-4 mr-1" />
                  Select All ({filteredPlayers.length})
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setFormData(prev => ({ 
                    ...prev, 
                    selectedPlayerIds: [] 
                  }))}
                  disabled={formData.selectedPlayerIds.length === 0}
                >
                  <UserX className="w-4 h-4 mr-1" />
                  Clear All
                </Button>
                <span className="text-slate-600">
                  {formData.selectedPlayerIds.length} of {teamMembers.length} players selected
                </span>
              </div>
            )}

            {/* Player List - Compact Circular Design */}
            {membersLoading ? (
              <div className="h-32 bg-slate-100 rounded-lg animate-pulse flex items-center justify-center">
                <div className="animate-spin w-6 h-6 border-4 border-primary border-t-transparent rounded-full" />
              </div>
            ) : filteredPlayers.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                {playerSearchTerm ? 'No players found matching your search.' : 'No players available.'}
              </div>
            ) : (
              <div className="max-h-60 sm:max-h-80 overflow-y-auto">
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2 sm:gap-3 p-2">
                  {filteredPlayers.map(member => {
                    const isSelected = formData.selectedPlayerIds.includes(member.id);
                    
                    return (
                      <div
                        key={member.id}
                        className="relative group cursor-pointer transition-all duration-200"
                        onClick={() => handlePlayerToggle(member.id)}
                      >
                        <div className={`w-12 h-12 sm:w-16 sm:h-16 mx-auto rounded-full flex items-center justify-center text-white font-bold text-sm sm:text-lg border-2 sm:border-4 transition-all duration-200 ${
                          isSelected
                            ? 'bg-primary border-primary shadow-lg scale-110'
                            : 'bg-slate-400 border-slate-300 group-hover:bg-slate-500 group-hover:border-slate-400 group-hover:scale-105'
                        }`}>
                          {isSelected ? (
                            <Check className="w-6 h-6" />
                          ) : (
                            <span className="text-sm">
                              {member.firstName?.[0]}{member.lastName?.[0]}
                            </span>
                          )}
                        </div>
                        
                        <div className="mt-2 text-center">
                          <p className={`text-xs font-medium truncate ${
                            isSelected ? 'text-primary' : 'text-slate-700'
                          }`}>
                            {getDisplayName(member)}
                          </p>
                          <p className={`text-xs truncate ${
                            isSelected ? 'text-primary/80' : 'text-slate-500'
                          }`}>
                            {member.position || 'No position'}
                          </p>
                        </div>
                        
                        {/* Selection indicator */}
                        {isSelected && (
                          <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center border-2 border-white">
                            <Check className="w-3 h-3 text-white" />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
                
                {/* Compact summary at bottom */}
                {filteredPlayers.length > 8 && (
                  <div className="mt-3 p-2 bg-slate-50 rounded-lg border-t">
                    <p className="text-xs text-slate-600 text-center">
                      Showing {Math.min(filteredPlayers.length, 12)} of {teamMembers.length} players
                      {playerSearchTerm && ` matching "${playerSearchTerm}"`}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Category and Fine Details */}
            <div className="space-y-4">
              {/* Category Selection */}
              <div className="space-y-2">
                <Label htmlFor="category">Category *</Label>
                <Select 
                  value={formData.categoryId} 
                  onValueChange={(categoryId) => {
                    setFormData(prev => ({ ...prev, categoryId, subcategoryId: "", amount: "" }));
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(category => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Subcategory Selection */}
              {formData.categoryId && (
                <div className="space-y-2">
                  <Label htmlFor="subcategory">Fine Type *</Label>
                  <Select 
                    value={formData.subcategoryId} 
                    onValueChange={handleSubcategoryChange}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select fine type" />
                    </SelectTrigger>
                    <SelectContent>
                      {subcategories.map(subcategory => (
                        <SelectItem key={subcategory.id} value={subcategory.id}>
                          <div className="flex justify-between items-center w-full">
                            <span>{subcategory.name}</span>
                            {subcategory.defaultAmount && (
                              <span className="text-sm text-slate-500 ml-2">
                                £{subcategory.defaultAmount}
                              </span>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Amount */}
              <div className="space-y-2">
                <Label htmlFor="amount">Amount (£) *</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.amount}
                  onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                  placeholder="Enter fine amount"
                />
                {formData.selectedPlayerIds.length > 1 && formData.amount && (
                  <p className="text-sm text-slate-600">
                    Total cost: <span className="font-semibold">{formatCurrency(totalCost)}</span> 
                    ({formData.selectedPlayerIds.length} players × {formatCurrency(parseFloat(formData.amount))})
                  </p>
                )}
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Additional details..."
                />
              </div>

              {/* Send Notification */}
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="sendNotification"
                  checked={formData.sendNotification}
                  onChange={(e) => setFormData(prev => ({ ...prev, sendNotification: e.target.checked }))}
                  className="rounded border-slate-300"
                />
                <Label htmlFor="sendNotification" className="text-sm">
                  Send notification to player(s)
                </Label>
              </div>
            </div>
          </form>
        </div>
        
        <DialogFooter className="pt-4 border-t">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            type="submit" 
            form="issue-fine-form"
            disabled={mutation.isPending || formData.selectedPlayerIds.length === 0}
          >
            {mutation.isPending ? (
              <div className="flex items-center space-x-2">
                <div className="animate-spin w-4 h-4 border-4 border-white border-t-transparent rounded-full" />
                <span>Issuing...</span>
              </div>
            ) : (
              `Issue Fine${formData.selectedPlayerIds.length > 1 ? 's' : ''}`
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}