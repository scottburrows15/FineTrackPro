import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { 
  Users, 
  Gavel, 
  Search, 
  CheckSquare,
  Square,
  AlertCircle,
  CheckCircle
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { User, FineSubcategory } from "@shared/schema";

interface BulkFineModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function BulkFineModal({ isOpen, onClose }: BulkFineModalProps) {
  const [selectedPlayers, setSelectedPlayers] = useState<string[]>([]);
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>("");
  const [description, setDescription] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: teamMembers = [], isLoading: membersLoading } = useQuery<User[]>({
    queryKey: ['/api/admin/team-members'],
    enabled: isOpen,
  });

  const { data: subcategories = [], isLoading: subcategoriesLoading } = useQuery<FineSubcategory[]>({
    queryKey: ['/api/admin/subcategories'],
    enabled: isOpen,
  });

  const bulkIssueFines = useMutation({
    mutationFn: async () => {
      const fineData = {
        playerIds: selectedPlayers,
        subcategoryId: selectedSubcategory,
        description: description.trim() || undefined,
      };
      
      return await apiRequest('POST', '/api/admin/bulk-issue-fines', fineData);
    },
    onSuccess: (data: any) => {
      toast({
        title: "Bulk Fines Issued",
        description: `Successfully issued ${data.count} fines to ${selectedPlayers.length} players`,
      });
      
      // Reset form
      setSelectedPlayers([]);
      setSelectedSubcategory("");
      setDescription("");
      setSearchTerm("");
      
      // Refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/admin/unpaid-fines'] });
      queryClient.invalidateQueries({ queryKey: ['/api/fines/team'] });
      queryClient.invalidateQueries({ queryKey: ['/api/stats/team'] });
      
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Issue Bulk Fines",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    },
  });

  const filteredPlayers = teamMembers.filter(member => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      member.firstName?.toLowerCase().includes(searchLower) ||
      member.lastName?.toLowerCase().includes(searchLower) ||
      member.email?.toLowerCase().includes(searchLower)
    );
  });

  const selectedSubcategoryDetails = subcategories.find(sub => sub.id === selectedSubcategory);

  const togglePlayer = (playerId: string) => {
    setSelectedPlayers(prev => 
      prev.includes(playerId) 
        ? prev.filter(id => id !== playerId)
        : [...prev, playerId]
    );
  };

  const selectAllPlayers = () => {
    setSelectedPlayers(filteredPlayers.map(p => p.id));
  };

  const clearSelection = () => {
    setSelectedPlayers([]);
  };

  const canSubmit = selectedPlayers.length > 0 && selectedSubcategory;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-hidden flex flex-col p-3 sm:p-6 bg-white dark:bg-slate-800 border-border">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <Gavel className="w-5 h-5" />
              Bulk Issue Fines
            </DialogTitle>
            <Button variant="outline" size="sm" onClick={onClose}>
              Close
            </Button>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col gap-4">
          {/* Fine Category Selection */}
          <Card>
            <CardContent className="p-4">
              <h3 className="font-medium text-slate-900 mb-3">Select Fine Type</h3>
              <div className="space-y-3">
                <Select value={selectedSubcategory} onValueChange={setSelectedSubcategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a fine type" />
                  </SelectTrigger>
                  <SelectContent>
                    {subcategoriesLoading ? (
                      <SelectItem value="loading" disabled>Loading fine types...</SelectItem>
                    ) : (
                      subcategories.map((subcategory) => (
                        <SelectItem key={subcategory.id} value={subcategory.id}>
                          {subcategory.name} - {formatCurrency(parseFloat(subcategory.defaultAmount))}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>

                {selectedSubcategoryDetails && (
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-blue-900">{selectedSubcategoryDetails.name}</span>
                      <Badge variant="outline" className="bg-blue-100 text-blue-800">
                        {formatCurrency(parseFloat(selectedSubcategoryDetails.defaultAmount))} each
                      </Badge>
                    </div>
                    <p className="text-sm text-blue-700">
                      {selectedSubcategoryDetails.name} fine will be issued to each selected player
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Player Selection */}
          <Card className="flex-1 overflow-hidden">
            <CardContent className="p-4 h-full flex flex-col">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium text-slate-900">
                  Select Players ({selectedPlayers.length} selected)
                </h3>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={selectAllPlayers}
                    disabled={filteredPlayers.length === 0}
                    className="text-xs"
                  >
                    <CheckSquare className="w-3 h-3 mr-1" />
                    All ({filteredPlayers.length})
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={clearSelection}
                    disabled={selectedPlayers.length === 0}
                    className="text-xs"
                  >
                    <Square className="w-3 h-3 mr-1" />
                    Clear
                  </Button>
                </div>
              </div>

              <div className="relative mb-3">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  placeholder="Search players..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              <ScrollArea className="flex-1">
                <div className="space-y-2">
                  {membersLoading ? (
                    <div className="space-y-2">
                      {[1, 2, 3].map(i => (
                        <div key={i} className="h-12 bg-slate-200 rounded-lg animate-pulse" />
                      ))}
                    </div>
                  ) : filteredPlayers.length === 0 ? (
                    <div className="text-center py-6 text-slate-500">
                      {searchTerm ? 'No players found matching your search.' : 'No team members found.'}
                    </div>
                  ) : (
                    filteredPlayers.map((player) => {
                      const isSelected = selectedPlayers.includes(player.id);
                      return (
                        <div
                          key={player.id}
                          className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                            isSelected 
                              ? 'bg-blue-50 border-blue-200 hover:bg-blue-100' 
                              : 'bg-white border-slate-200 hover:bg-slate-50'
                          }`}
                          onClick={() => togglePlayer(player.id)}
                        >
                          <Checkbox 
                            checked={isSelected}
                            onChange={() => togglePlayer(player.id)}
                            className="pointer-events-none"
                          />
                          
                          <div className="w-8 h-8 bg-slate-200 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden">
                            {player.profileImageUrl ? (
                              <img 
                                src={player.profileImageUrl} 
                                alt={`${player.firstName} ${player.lastName}`}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <span className="text-xs font-medium text-slate-600">
                                {player.firstName?.[0]}{player.lastName?.[0]}
                              </span>
                            )}
                          </div>
                          
                          <div className="flex-1">
                            <div className="font-medium text-slate-900">
                              {player.firstName} {player.lastName}
                            </div>
                            <div className="text-sm text-slate-600">{player.email}</div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Optional Description */}
          <Card>
            <CardContent className="p-4">
              <h3 className="font-medium text-slate-900 mb-3">Additional Details (Optional)</h3>
              <Textarea
                placeholder="Add any additional context or details for this fine..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="resize-none"
              />
            </CardContent>
          </Card>

          {/* Summary & Submit */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {canSubmit ? (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-amber-500" />
                  )}
                  <div>
                    <div className="font-medium text-slate-900">
                      {selectedPlayers.length === 0 ? 'No players selected' : 
                       selectedSubcategory === "" ? 'No fine type selected' :
                       `Ready to issue ${selectedPlayers.length} fine${selectedPlayers.length !== 1 ? 's' : ''}`}
                    </div>
                    {canSubmit && selectedSubcategoryDetails && (
                      <div className="text-sm text-slate-600">
                        Total amount: {formatCurrency(parseFloat(selectedSubcategoryDetails.defaultAmount) * selectedPlayers.length)}
                      </div>
                    )}
                  </div>
                </div>
                
                <Button
                  onClick={() => bulkIssueFines.mutate()}
                  disabled={!canSubmit || bulkIssueFines.isPending}
                  className="flex items-center gap-2"
                >
                  <Gavel className="w-4 h-4" />
                  {bulkIssueFines.isPending ? 'Issuing...' : 'Issue Fines'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}