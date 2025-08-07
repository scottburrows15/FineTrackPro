import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { suggestIcon } from "@/lib/utils";

interface IssueFineModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function IssueFineModal({ isOpen, onClose }: IssueFineModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState({
    playerId: "",
    categoryId: "",
    subcategoryId: "",
    amount: "",
    description: "",
    sendNotification: true,
  });

  // Mock data for now - replace with actual queries
  const players = [
    { id: "1", name: "James Mitchell" },
    { id: "2", name: "Marcus Thompson" },
    { id: "3", name: "David Kumar" },
    { id: "4", name: "Alex Rodriguez" },
    { id: "5", name: "Ryan O'Connor" },
  ];

  const categories = [
    { id: "1", name: "Training" },
    { id: "2", name: "Match Day" },
    { id: "3", name: "Social" },
  ];

  const subcategories = [
    { id: "1", name: "Late Arrival", categoryId: "1", defaultAmount: "5.00" },
    { id: "2", name: "Forgot Kit", categoryId: "1", defaultAmount: "10.00" },
    { id: "3", name: "Red Card", categoryId: "2", defaultAmount: "32.50" },
    { id: "4", name: "Yellow Card", categoryId: "2", defaultAmount: "15.00" },
    { id: "5", name: "Missing Event", categoryId: "3", defaultAmount: "20.00" },
  ];

  const mutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("POST", "/api/fines", data);
    },
    onSuccess: () => {
      toast({
        title: "Fine Issued",
        description: "The fine has been issued successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/fines"] });
      onClose();
      setFormData({
        playerId: "",
        categoryId: "",
        subcategoryId: "",
        amount: "",
        description: "",
        sendNotification: true,
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to issue fine",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.playerId || !formData.subcategoryId || !formData.amount) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    mutation.mutate({
      playerId: formData.playerId,
      subcategoryId: formData.subcategoryId,
      amount: formData.amount,
      description: formData.description,
    });
  };

  const filteredSubcategories = subcategories.filter(
    sub => sub.categoryId === formData.categoryId
  );

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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Issue New Fine</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="player">Player *</Label>
              <Select 
                value={formData.playerId}
                onValueChange={(value) => setFormData(prev => ({ ...prev, playerId: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a player..." />
                </SelectTrigger>
                <SelectContent>
                  {players.map(player => (
                    <SelectItem key={player.id} value={player.id}>
                      {player.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">Amount (£) *</Label>
              <Input
                id="amount"
                type="number"
                step="0.50"
                min="0"
                value={formData.amount}
                onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                placeholder="5.00"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Category *</Label>
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
          </div>

          <div className="space-y-2">
            <Label htmlFor="subcategory">Subcategory *</Label>
            <Select 
              value={formData.subcategoryId}
              onValueChange={handleSubcategoryChange}
              disabled={!formData.categoryId}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select subcategory..." />
              </SelectTrigger>
              <SelectContent>
                {filteredSubcategories.map(subcategory => (
                  <SelectItem key={subcategory.id} value={subcategory.id}>
                    {subcategory.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
              {mutation.isPending ? "Issuing Fine..." : "Issue Fine"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
