import { useState, useEffect, useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { getDisplayName } from "@/lib/userUtils";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { FineCategory, FineSubcategory, User } from "@shared/schema";
import { motion, AnimatePresence } from "framer-motion";
import { Search, PoundSterling, Users, XCircle, Gavel } from "lucide-react";

export default function FlowingFineIssuer() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [playerSearchTerm, setPlayerSearchTerm] = useState("");
  const [expandedSummary, setExpandedSummary] = useState(false);
  const [gavelBang, setGavelBang] = useState(false);

  const [formData, setFormData] = useState({
    selectedPlayerIds: [] as string[],
    categoryId: "",
    subcategoryId: "",
    amount: "",
    description: "",
  });

  const { data: categories = [] } = useQuery<FineCategory[]>({ queryKey: ["/api/categories"] });
  const { data: subcategories = [] } = useQuery<FineSubcategory[]>({
    queryKey: ["/api/subcategories", formData.categoryId],
    enabled: !!formData.categoryId,
  });
  const { data: teamMembers = [] } = useQuery<User[]>({ queryKey: ["/api/admin/team-members"] });

  const filteredPlayers = useMemo(() => {
    const searchLower = playerSearchTerm.toLowerCase().trim();
    return teamMembers.filter((p) => {
      const fullName = `${p.firstName} ${p.lastName}`.toLowerCase();
      const nick = (p.nickname || "").toLowerCase();
      return fullName.includes(searchLower) || nick.includes(searchLower);
    });
  }, [teamMembers, playerSearchTerm]);

  useEffect(() => {
    if (formData.categoryId && subcategories.length > 0) {
      const firstSub = subcategories[0];
      setFormData((p) => ({
        ...p,
        subcategoryId: firstSub.id,
        amount: String(firstSub.defaultAmount),
      }));
    }
  }, [formData.categoryId, subcategories]);

  useEffect(() => {
    const selectedSub = subcategories.find((s) => s.id === formData.subcategoryId);
    if (selectedSub)
      setFormData((p) => ({ ...p, amount: String(selectedSub.defaultAmount) }));
  }, [formData.subcategoryId, subcategories]);

  const mutation = useMutation({
    mutationFn: async (data: any) => apiRequest("POST", "/api/fines/bulk", data),
    onSuccess: () => {
      toast({
        title: "Fines Issued",
        description: `Successfully issued ${formData.selectedPlayerIds.length} fine(s).`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/fines"] });
      resetForm();

      setGavelBang(true);
      setTimeout(() => setGavelBang(false), 400);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to issue fine(s)",
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
    setExpandedSummary(false);
  };

  const togglePlayer = (id: string) => {
    setFormData((p) => ({
      ...p,
      selectedPlayerIds: p.selectedPlayerIds.includes(id)
        ? p.selectedPlayerIds.filter((x) => x !== id)
        : [...p.selectedPlayerIds, id],
    }));
  };

  const removeSelectedPlayer = (id: string) => {
    setFormData((p) => ({
      ...p,
      selectedPlayerIds: p.selectedPlayerIds.filter((x) => x !== id),
    }));
  };

  const selectedPlayers = teamMembers.filter((p) =>
    formData.selectedPlayerIds.includes(p.id)
  );

  const selectedSub = subcategories.find((s) => s.id === formData.subcategoryId);

  const totalAmount =
    parseFloat(formData.amount || "0") * selectedPlayers.length || 0;

  // consistent initials
  const initials = (player: User) =>
    `${player.firstName?.[0] || ""}${player.lastName?.[0] || ""}`.toUpperCase();

  const confirmAndSubmit = () => {
    if (!formData.selectedPlayerIds.length || !formData.subcategoryId) {
      toast({
        title: "Missing Info",
        description: "Select players and fine type before issuing.",
        variant: "destructive",
      });
      return;
    }

    mutation.mutate({
      playerIds: formData.selectedPlayerIds,
      subcategoryId: formData.subcategoryId,
      amount: formData.amount,
      description: formData.description,
    });
  };

  return (
    <div className="space-y-3 p-2 max-w-4xl mx-auto">

      {/* SELECT FINE */}
      <div className="space-y-2">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Gavel className="h-6 w-6 text-rose-600" />
          Select Fine
        </h2>

        <div>
          <label className="text-sm font-semibold">Category</label>
          <select
            className="w-full mt-1 p-2 rounded-lg border bg-white text-gray-900 focus:ring-2 focus:ring-blue-400"
            value={formData.categoryId}
            onChange={(e) =>
              setFormData((p) => ({
                ...p,
                categoryId: e.target.value,
                subcategoryId: "",
              }))
            }
          >
            <option value="">Select category</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        {formData.categoryId && (
          <div className="flex flex-wrap gap-2 mt-2">
            {subcategories.map((s) => {
              const active = formData.subcategoryId === s.id;
              return (
                <motion.button
                  key={s.id}
                  onClick={() =>
                    setFormData((p) => ({
                      ...p,
                      subcategoryId: s.id,
                      amount: String(s.defaultAmount),
                    }))
                  }
                  whileTap={{ scale: 0.95 }}
                  className={`px-3 py-1 rounded-full font-semibold border transition-all ${
                    active
                      ? "bg-blue-600 text-white border-blue-700 shadow"
                      : "bg-white border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  {s.name} (£{s.defaultAmount})
                </motion.button>
              );
            })}
          </div>
        )}

        {selectedSub && (
          <div className="mt-2">
            <label className="text-sm font-semibold flex items-center gap-1">
              <PoundSterling className="h-4 w-4" />
              Amount
            </label>

            <Input
              type="number"
              value={formData.amount}
              onChange={(e) =>
                setFormData((p) => ({ ...p, amount: e.target.value }))
              }
              className="bg-white border focus:ring-2 focus:ring-blue-400"
            />
          </div>
        )}
      </div>

      {/* PLAYER SELECTION */}
      <div className="space-y-2">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Users className="h-6 w-6 text-blue-600" />
          Select Players
        </h2>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />

          <Input
            placeholder="Search players..."
            value={playerSearchTerm}
            onChange={(e) => setPlayerSearchTerm(e.target.value)}
            className="pl-9 bg-white border focus:ring-2 focus:ring-blue-400"
          />
        </div>

        <ScrollArea className="h-[160px] mt-2">
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
            {filteredPlayers.map((p) => {
              const selected = formData.selectedPlayerIds.includes(p.id);
              const label = getDisplayName(p);

              return (
                <motion.button
                  key={p.id}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => togglePlayer(p.id)}
                  className={`flex flex-col items-center p-2 rounded-xl border font-semibold text-xs transition-all ${
                    selected
                      ? "bg-blue-100 border-blue-400 shadow"
                      : "bg-white border-gray-300 hover:shadow hover:scale-105"
                  }`}
                >
                  <Avatar className="h-12 w-12 rounded-full shadow overflow-hidden">
                    {p.profileImageUrl ? (
                      <AvatarImage src={p.profileImageUrl} alt={label} />
                    ) : (
                      <AvatarFallback className="bg-gray-300 text-xs font-bold">
                        {initials(p)}
                      </AvatarFallback>
                    )}
                  </Avatar>

                  <span className="mt-1 text-center truncate w-full">
                    {label}
                  </span>
                </motion.button>
              );
            })}
          </div>
        </ScrollArea>
      </div>

      {/* DESCRIPTION */}
      <div className="space-y-1">
        <label className="text-sm font-semibold">Description</label>
        <Textarea
          rows={3}
          value={formData.description}
          onChange={(e) =>
            setFormData((p) => ({ ...p, description: e.target.value }))
          }
          className="bg-white border focus:ring-2 focus:ring-blue-400"
        />
      </div>

      {/* SUMMARY */}
      <div className="space-y-1 pt-2">
        <div className="flex justify-between font-medium">
          <span>Players Selected</span>
          <span>{selectedPlayers.length}</span>
        </div>

        <div className="flex justify-between font-medium">
          <span>Amount Each</span>
          <span>£{formData.amount || 0}</span>
        </div>

        <div className="flex justify-between font-semibold border-t pt-2">
          <span>Total</span>
          <span>£{totalAmount}</span>
        </div>

        <Button
          variant="outline"
          className="w-full mt-1 text-xs bg-white border hover:bg-gray-100"
          onClick={() => setExpandedSummary((v) => !v)}
        >
          {expandedSummary ? "Hide Players" : "Show Players"}
        </Button>

        <AnimatePresence>
          {expandedSummary && (
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: "auto" }}
              exit={{ height: 0 }}
              className="overflow-hidden mt-1"
            >
              <div className="flex flex-wrap gap-2">
                {selectedPlayers.map((p) => {
                  const label = getDisplayName(p);

                  return (
                    <div
                      key={p.id}
                      className="flex items-center gap-2 bg-white rounded-md px-2 py-1 text-xs border"
                    >
                      <Avatar className="h-6 w-6 rounded-full shadow overflow-hidden">
                        {p.profileImageUrl ? (
                          <AvatarImage src={p.profileImageUrl} alt={label} />
                        ) : (
                          <AvatarFallback className="bg-gray-300 text-[10px] font-bold">
                            {initials(p)}
                          </AvatarFallback>
                        )}
                      </Avatar>

                      <span>{label}</span>

                      <XCircle
                        className="h-4 w-4 cursor-pointer"
                        onClick={() => removeSelectedPlayer(p.id)}
                      />
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ISSUE FINE BUTTON WITH WHITE CIRCLE GAVEL */}
      <div className="flex justify-center mt-4">
        <motion.button
          onClick={confirmAndSubmit}
          className="flex flex-col items-center justify-center w-40 h-40"
          animate={
            gavelBang
              ? { rotate: [0, -20, 0], scale: [1, 1.2, 1] }
              : {}
          }
          transition={{ duration: 0.4 }}
        >
          <div className="h-24 w-24 bg-white rounded-full shadow flex items-center justify-center">
            <Gavel className="h-14 w-14 text-rose-600" />
          </div>

          <span className="mt-2 font-bold text-lg text-rose-700">
            Issue Fine{selectedPlayers.length > 1 ? "s" : ""}
          </span>
        </motion.button>
      </div>
    </div>
  );
}