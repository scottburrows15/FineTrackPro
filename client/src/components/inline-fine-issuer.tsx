import { useState, useEffect, useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { getDisplayName } from "@/lib/userUtils";
import { formatCurrency } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Search,
  CheckSquare,
  Square,
  Gavel,
  PoundSterling,
  UserCheck,
  UserX
} from "lucide-react";
import type { FineCategory, FineSubcategory, User } from "@shared/schema";

export default function CompactFineIssuer() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [playerSearchTerm, setPlayerSearchTerm] = useState("");

  const [formData, setFormData] = useState({
    selectedPlayerIds: [] as string[],
    categoryId: "",
    subcategoryId: "",
    amount: "",
    description: "",
  });

  // Fetch data
  const { data: categories = [] } = useQuery<FineCategory[]>({
    queryKey: ["/api/categories"],
  });

  const { data: subcategories = [] } = useQuery<FineSubcategory[]>({
    queryKey: ["/api/subcategories", formData.categoryId],
    enabled: !!formData.categoryId,
  });

  const { data: teamMembers = [] } = useQuery<User[]>({
    queryKey: ["/api/admin/team-members"],
  });

  // Filter players based on search term
  const filteredPlayers = useMemo(() => {
    return teamMembers.filter(player => {
      if (!playerSearchTerm) return true;
      const searchLower = playerSearchTerm.toLowerCase().trim();
      const firstName = (player.firstName || '').toLowerCase();
      const lastName = (player.lastName || '').toLowerCase();
      const fullName = `${firstName} ${lastName}`;
      const position = (player.position || '').toLowerCase();
      const playerNumber = (player.playerNumber || '').toString();
      
      return firstName.includes(searchLower) || 
             lastName.includes(searchLower) || 
             fullName.includes(searchLower) || 
             position.includes(searchLower) ||
             playerNumber.includes(searchLower);
    });
  }, [teamMembers, playerSearchTerm]);

  // Update subcategory and amount when category changes
  useEffect(() => {
    if (formData.categoryId && subcategories.length > 0) {
      const firstSubcat = subcategories[0];
      setFormData(prev => ({
        ...prev,
        subcategoryId: firstSubcat.id,
        amount: firstSubcat.defaultAmount.toString(),
      }));
    }
  }, [formData.categoryId, subcategories]);

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
    setFormData(prev => ({
      ...prev,
      selectedPlayerIds: prev.selectedPlayerIds.includes(playerId)
        ? prev.selectedPlayerIds.filter(id => id !== playerId)
        : [...prev.selectedPlayerIds, playerId]
    }));
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
  const selectedPlayers = teamMembers.filter(p => formData.selectedPlayerIds.includes(p.id));
  const totalAmount = parseFloat(formData.amount || '0') * selectedPlayers.length;

  // Compact name display - first name + last initial
  const getCompactName = (player: User) => {
    const firstName = player.firstName || '';
    const lastName = player.lastName || '';
    if (!firstName && !lastName) return 'Unknown Player';
    
    if (lastName) {
      return `${firstName} ${lastName.charAt(0)}.`;
    }
    return firstName;
  };

  return (
    <Card className="bg-white dark:bg-slate-800 border-border">
      <CardContent className="p-4">
        <form onSubmit={handleSubmit}>
          <div className="grid md:grid-cols-2 gap-6">
            {/* Player Selection - Left Column */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium">Players</div>
                {formData.selectedPlayerIds.length > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    {formData.selectedPlayerIds.length}
                  </Badge>
                )}
              </div>
              
              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search..."
                  value={playerSearchTerm}
                  onChange={(e) => setPlayerSearchTerm(e.target.value)}
                  className="pl-7 text-sm h-8"
                />
              </div>

              {/* Selection Actions */}
              <div className="flex gap-1">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={selectAllPlayers}
                  disabled={filteredPlayers.length === 0}
                  className="h-7 text-xs flex-1"
                >
                  <CheckSquare className="h-3 w-3 mr-1" />
                  All
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={clearSelection}
                  disabled={formData.selectedPlayerIds.length === 0}
                  className="h-7 text-xs flex-1"
                >
                  <Square className="h-3 w-3 mr-1" />
                  Clear
                </Button>
                <div className="text-xs text-muted-foreground flex items-center px-2">
                  {filteredPlayers.length}
                </div>
              </div>

              {/* Compact Player Grid */}
              <ScrollArea className="h-[200px] border rounded-md">
                <div className="p-2">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-1">
                    {filteredPlayers.map((player) => {
                      const isSelected = formData.selectedPlayerIds.includes(player.id);
                      return (
                        <button
                          key={player.id}
                          type="button"
                          onClick={() => togglePlayer(player.id)}
                          className={`p-2 rounded-md text-left transition-colors text-xs ${
                            isSelected 
                              ? 'bg-blue-100 dark:bg-blue-900/30 border border-blue-300' 
                              : 'bg-white dark:bg-slate-800 border border-border hover:bg-slate-100'
                          }`}
                        >
                          <div className="flex items-center gap-1.5">
                            {isSelected ? (
                              <UserCheck className="h-3 w-3 text-blue-500 flex-shrink-0" />
                            ) : (
                              <UserX className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                            )}
                            <div className="flex-1 min-w-0">
                              <div className="font-medium truncate">
                                {getCompactName(player)}
                              </div>
                              {player.playerNumber && (
                                <div className="text-[10px] text-muted-foreground">
                                  #{player.playerNumber}
                                </div>
                              )}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </ScrollArea>
            </div>

            {/* Fine Details - Right Column */}
            <div className="space-y-4">
              <div className="space-y-4">
                <div className="text-sm font-medium">Fine Details</div>
                
                {/* Fine Category */}
                <div className="space-y-2">
                  <div className="text-xs font-medium">Category</div>
                  <Select
                    value={formData.categoryId}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, categoryId: value, subcategoryId: "" }))}
                  >
                    <SelectTrigger className="h-8 text-sm">
                      <SelectValue placeholder="Select category" />
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
                  <div className="space-y-2">
                    <div className="text-xs font-medium">Type</div>
                    <Select
                      value={formData.subcategoryId}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, subcategoryId: value }))}
                    >
                      <SelectTrigger className="h-8 text-sm">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        {subcategories.map((sub) => (
                          <SelectItem key={sub.id} value={sub.id}>
                            <div className="flex justify-between items-center w-full text-sm">
                              <span>{sub.name}</span>
                              <span className="text-muted-foreground text-xs">
                                {formatCurrency(sub.defaultAmount)}
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Amount */}
                {selectedSubcategory && (
                  <div className="space-y-2">
                    <div className="text-xs font-medium flex items-center gap-1">
                      <PoundSterling className="h-3 w-3" />
                      Amount
                    </div>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.amount}
                        onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                        className="h-8 text-sm flex-1"
                      />
                      <Badge variant="outline" className="text-xs whitespace-nowrap">
                        Default: {formatCurrency(selectedSubcategory.defaultAmount)}
                      </Badge>
                    </div>
                  </div>
                )}

                {/* Description */}
                <div className="space-y-2">
                  <div className="text-xs font-medium">Description</div>
                  <Textarea
                    placeholder="Additional details..."
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    rows={2}
                    className="text-sm resize-none"
                  />
                </div>
              </div>

              {/* Summary and Submit */}
              <div className="pt-2 border-t">
                <div className="space-y-3">
                  {selectedPlayers.length > 0 && (
                    <div className="text-xs text-muted-foreground space-y-1">
                      <div className="flex justify-between">
                        <span>Players:</span>
                        <span className="font-medium">{selectedPlayers.length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Each:</span>
                        <span>{formatCurrency(parseFloat(formData.amount || '0'))}</span>
                      </div>
                      {selectedPlayers.length > 1 && (
                        <div className="flex justify-between font-semibold text-foreground pt-1 border-t">
                          <span>Total:</span>
                          <span>{formatCurrency(totalAmount)}</span>
                        </div>
                      )}
                    </div>
                  )}
                  
                  <Button
                    type="submit"
                    className="w-full bg-red-600 hover:bg-red-700 text-white h-9"
                    disabled={mutation.isPending || !formData.selectedPlayerIds.length || !formData.subcategoryId}
                  >
                    <Gavel className="mr-2 h-4 w-4" />
                    {mutation.isPending 
                      ? "Issuing..." 
                      : `Issue Fine${formData.selectedPlayerIds.length > 1 ? 's' : ''}`
                    }
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}