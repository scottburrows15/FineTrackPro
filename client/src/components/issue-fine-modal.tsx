import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { getDisplayName } from "@/lib/userUtils";
import { Users, PoundSterling, Check, X, Search, UserCheck, UserX } from "lucide-react";
import type { User, FineCategory, FineSubcategory } from "@shared/schema";

interface IssueFineModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function IssueFineModal({ isOpen, onClose }: IssueFineModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState({
    selectedPlayerIds: [] as string[],
    categoryId: "",
    subcategoryId: "",
    amount: "",
    description: "",
    sendNotification: true,
  });
  
  const [showMultiSelect, setShowMultiSelect] = useState(false);
  const [playerSearchTerm, setPlayerSearchTerm] = useState("");
  const [selectionMode, setSelectionMode] = useState<'single' | 'multiple'>('single');

  // Fetch real data
  const { data: teamMembers = [], isLoading: membersLoading } = useQuery<User[]>({
    queryKey: ["/api/admin/team-members"],
    enabled: isOpen,
  });

  const { data: categories = [], isLoading: categoriesLoading } = useQuery<FineCategory[]>({
    queryKey: ["/api/categories"],
    enabled: isOpen,
  });

  const { data: subcategories = [], isLoading: subcategoriesLoading } = useQuery<FineSubcategory[]>({
    queryKey: ["/api/categories", formData.categoryId, "subcategories"],
    enabled: isOpen && !!formData.categoryId,
  });

  // Filter players based on search term
  const filteredPlayers = teamMembers.filter(player => {
    if (!playerSearchTerm) return true;
    const searchLower = playerSearchTerm.toLowerCase();
    const fullName = `${player.firstName} ${player.lastName}`.toLowerCase();
    const position = (player.position || '').toLowerCase();
    return fullName.includes(searchLower) || position.includes(searchLower);
  });

  // Bulk fine mutation for multiple players
  const mutation = useMutation({
    mutationFn: async (data: any) => {
      if (data.selectedPlayerIds.length === 1) {
        // Single player fine
        return await apiRequest("POST", "/api/fines", {
          playerId: data.selectedPlayerIds[0],
          subcategoryId: data.subcategoryId,
          amount: data.amount,
          description: data.description,
        });
      } else {
        // Bulk fine assignment
        return await apiRequest("POST", "/api/fines/bulk", {
          playerIds: data.selectedPlayerIds,
          subcategoryId: data.subcategoryId,
          amount: data.amount,
          description: data.description,
        });
      }
    },
    onSuccess: () => {
      const playerCount = formData.selectedPlayerIds.length;
      toast({
        title: `Fine${playerCount > 1 ? 's' : ''} Issued`,
        description: `Successfully issued ${playerCount > 1 ? `${playerCount} fines` : 'fine'}.`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/fines"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/unpaid-fines"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats/team"] });
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
    setShowMultiSelect(false);
    setPlayerSearchTerm("");
    setSelectionMode('single');
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
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Issue New Fine</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Player Selection */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-base font-semibold">Players *</Label>
              <div className="flex items-center space-x-2">
                <Button
                  type="button"
                  variant={selectionMode === 'multiple' ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    setSelectionMode(selectionMode === 'multiple' ? 'single' : 'multiple');
                    setFormData(prev => ({ ...prev, selectedPlayerIds: [] }));
                  }}
                >
                  <Users className="w-4 h-4 mr-2" />
                  {selectionMode === 'multiple' ? 'Multi-Select' : 'Single Player'}
                </Button>
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

            {/* Quick Actions for Multiple Selection */}
            {selectionMode === 'multiple' && filteredPlayers.length > 0 && (
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

            {/* Player List */}
            {membersLoading ? (
              <div className="h-32 bg-slate-100 rounded-lg animate-pulse flex items-center justify-center">
                <div className="animate-spin w-6 h-6 border-4 border-primary border-t-transparent rounded-full" />
              </div>
            ) : filteredPlayers.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                {playerSearchTerm ? 'No players found matching your search.' : 'No players available.'}
              </div>
            ) : selectionMode === 'multiple' ? (
              <div className="max-h-64 overflow-y-auto border-2 border-slate-200 rounded-lg p-3 space-y-2 bg-slate-50">
                {filteredPlayers.map(member => (
                  <div
                    key={member.id}
                    className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors border ${
                      formData.selectedPlayerIds.includes(member.id)
                        ? 'bg-primary/10 border-primary/30 shadow-sm'
                        : 'bg-white hover:bg-slate-50 border-slate-200 hover:border-slate-300'
                    }`}
                    onClick={() => handlePlayerToggle(member.id)}
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        formData.selectedPlayerIds.includes(member.id)
                          ? 'bg-primary/20 text-primary'
                          : 'bg-slate-200 text-slate-600'
                      }`}>
                        <span className="text-sm font-medium">
                          {member.firstName?.[0]}{member.lastName?.[0]}
                        </span>
                      </div>
                      <div>
                        <div className="font-medium text-slate-900">
                          {getDisplayName(member)}
                        </div>
                        <div className="text-sm text-slate-600">
                          {member.position || 'No position set'}
                        </div>
                      </div>
                    </div>
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                      formData.selectedPlayerIds.includes(member.id)
                        ? 'bg-primary border-primary'
                        : 'border-slate-300'
                    }`}>
                      {formData.selectedPlayerIds.includes(member.id) && (
                        <Check className="w-4 h-4 text-white" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {filteredPlayers.map(member => (
                  <div
                    key={member.id}
                    className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors border ${
                      formData.selectedPlayerIds.includes(member.id)
                        ? 'bg-primary/10 border-primary/30 shadow-sm'
                        : 'bg-white hover:bg-slate-50 border-slate-200 hover:border-slate-300'
                    }`}
                    onClick={() => setFormData(prev => ({ ...prev, selectedPlayerIds: [member.id] }))}
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        formData.selectedPlayerIds.includes(member.id)
                          ? 'bg-primary/20 text-primary'
                          : 'bg-slate-200 text-slate-600'
                      }`}>
                        <span className="text-sm font-medium">
                          {member.firstName?.[0]}{member.lastName?.[0]}
                        </span>
                      </div>
                      <div>
                        <div className="font-medium text-slate-900">
                          {getDisplayName(member)}
                        </div>
                        <div className="text-sm text-slate-600">
                          {member.position || 'No position set'}
                        </div>
                      </div>
                    </div>
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                      formData.selectedPlayerIds.includes(member.id)
                        ? 'bg-primary border-primary'
                        : 'border-slate-300'
                    }`}>
                      {formData.selectedPlayerIds.includes(member.id) && (
                        <Check className="w-4 h-4 text-white" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="category">Category *</Label>
              {categoriesLoading ? (
                <div className="h-10 bg-slate-100 rounded-lg animate-pulse" />
              ) : (
                <Select 
                  value={formData.categoryId}
                  onValueChange={(value) => setFormData(prev => ({ 
                    ...prev, 
                    categoryId: value, 
                    subcategoryId: "", 
                    amount: "" 
                  }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category..." />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(category => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="subcategory">Subcategory *</Label>
              {subcategoriesLoading ? (
                <div className="h-10 bg-slate-100 rounded-lg animate-pulse" />
              ) : (
                <Select 
                  value={formData.subcategoryId}
                  onValueChange={handleSubcategoryChange}
                  disabled={!formData.categoryId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select subcategory..." />
                  </SelectTrigger>
                  <SelectContent>
                    {subcategories.map(subcategory => (
                      <SelectItem key={subcategory.id} value={subcategory.id}>
                        <div className="flex items-center justify-between w-full">
                          <span>{subcategory.name}</span>
                          <Badge variant="outline" className="ml-2">
                            £{subcategory.defaultAmount}
                          </Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>
          
          {/* Amount Section with Preset Info */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="amount">Amount per Player (£) *</Label>
              {selectedSubcategory && (
                <div className="text-sm text-slate-600">
                  Preset: £{selectedSubcategory.defaultAmount}
                </div>
              )}
            </div>
            <div className="relative">
              <PoundSterling className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                id="amount"
                type="number"
                step="0.50"
                min="0"
                value={formData.amount}
                onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                placeholder="5.00"
                className="pl-10"
              />
            </div>
            {formData.selectedPlayerIds.length > 1 && formData.amount && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="text-sm text-blue-900">
                  <strong>Total Cost:</strong> £{totalCost.toFixed(2)} 
                  ({formData.selectedPlayerIds.length} players × £{formData.amount})
                </div>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Details (Optional)</Label>
            <Textarea
              id="description"
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Add any additional details about the fine..."
            />
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox 
              id="notification"
              checked={formData.sendNotification}
              onCheckedChange={(checked) => 
                setFormData(prev => ({ ...prev, sendNotification: !!checked }))
              }
            />
            <Label htmlFor="notification">Send notification to player</Label>
          </div>

          <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3 pt-4 border-t">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={mutation.isPending}
              className="flex-1"
            >
              {mutation.isPending ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                  <span>Issuing...</span>
                </div>
              ) : (
                <span>
                  Issue Fine{formData.selectedPlayerIds.length > 1 ? 's' : ''}
                  {formData.selectedPlayerIds.length > 1 && ` (${formData.selectedPlayerIds.length})`}
                </span>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
