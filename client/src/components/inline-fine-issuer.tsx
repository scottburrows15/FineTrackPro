import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { FineCategory, FineSubcategory, User } from "@shared/schema";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Search, 
  X, 
  Gavel, 
  Check,
  ArrowRight,
  Filter,
  User as UserIcon,
  Zap,
  ChevronDown,
  History,
  Trash2
} from "lucide-react";

/**
 * Clean & Professional Fine Issuer
 * - Implements Minimalist Standard Select for Category
 * - Distinct Clear Search vs Clear Selection buttons
 * - Sticky Description
 * - Fast "Hold" Action (350ms)
 */

export default function ProfessionalFineIssuer() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // --- State ---
  const [playerSearchTerm, setPlayerSearchTerm] = useState("");
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  
  // Interaction State
  const [isHolding, setIsHolding] = useState(false);
  const [holdProgress, setHoldProgress] = useState(0);
  const [successAnim, setSuccessAnim] = useState(false);
  const startTimeRef = useRef<number>(0);
  const animationFrameRef = useRef<number>(0);

  const [formData, setFormData] = useState({
    selectedPlayerIds: [] as string[],
    categoryId: "",
    subcategoryId: "",
    amount: "",
    description: "",
  });

  // --- Data Fetching ---
  const { data: categories = [] } = useQuery<FineCategory[]>({ queryKey: ["/api/categories"] });
  const { data: subcategories = [] } = useQuery<FineSubcategory[]>({
    queryKey: ["/api/subcategories", formData.categoryId],
    enabled: !!formData.categoryId,
  });
  const { data: teamMembers = [] } = useQuery<User[]>({ queryKey: ["/api/admin/team-members"] });

  // --- Logic ---
  const filteredPlayers = useMemo(() => {
    const q = playerSearchTerm.toLowerCase().trim();
    if (!q) return teamMembers;
    return teamMembers.filter((p) => {
      const first = (p.firstName || "").toLowerCase();
      const last = (p.lastName || "").toLowerCase();
      const full = `${first} ${last}`;
      const nick = (p.nickname || "").toLowerCase();
      return first.includes(q) || last.includes(q) || full.includes(q) || nick.includes(q);
    });
  }, [teamMembers, playerSearchTerm]);

  const selectedPlayersSet = useMemo(() => new Set(formData.selectedPlayerIds), [formData.selectedPlayerIds]);
  const selectedCount = formData.selectedPlayerIds.length;
  const selectedSub = subcategories.find((s) => s.id === formData.subcategoryId);

  // --- "Sticky" Description Logic ---
  useEffect(() => {
    const savedDesc = localStorage.getItem("foulpay_last_desc");
    if (savedDesc) {
      setFormData(p => ({ ...p, description: savedDesc }));
    }
  }, []);

  // --- Auto-Select Defaults ---
  useEffect(() => {
    if (!formData.categoryId && categories.length > 0) {
      const firstCat = categories[0];
      setFormData(p => ({ ...p, categoryId: firstCat.id }));
    }
  }, [categories, formData.categoryId]);

  useEffect(() => {
    if (formData.categoryId && subcategories.length > 0) {
      const firstSub = subcategories[0];
      setFormData((p) => ({ 
        ...p, 
        subcategoryId: firstSub.id, 
        amount: String(firstSub.defaultAmount) 
      }));
    } else {
      setFormData((p) => ({ ...p, subcategoryId: "", amount: "" }));
    }
  }, [formData.categoryId, subcategories]);

  useEffect(() => {
    if (!formData.subcategoryId) return;
    const sub = subcategories.find((s) => s.id === formData.subcategoryId);
    if (sub) setFormData((p) => ({ ...p, amount: String(sub.defaultAmount) }));
  }, [formData.subcategoryId, subcategories]);

  // --- Mutation ---
  const mutation = useMutation({
    mutationFn: async (data: any) => apiRequest("POST", "/api/fines/bulk", data),
    onSuccess: () => {
      if (formData.description) {
        localStorage.setItem("foulpay_last_desc", formData.description);
      }

      setTimeout(() => {
        toast({ title: "Justice Served!", description: `Fine issued to ${selectedCount} players.` });
        queryClient.invalidateQueries({ queryKey: ["/api/fines"] });
        resetForm();
      }, 1000);
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to issue fines.", variant: "destructive" });
      setSuccessAnim(false);
      setHoldProgress(0);
    },
  });

  const resetForm = () => {
    const savedDesc = localStorage.getItem("foulpay_last_desc") || "";
    setFormData({ 
      selectedPlayerIds: [], 
      categoryId: categories[0]?.id || "", 
      subcategoryId: "", 
      amount: "", 
      description: savedDesc
    });
    setPlayerSearchTerm("");
    setIsSheetOpen(false);
    setSuccessAnim(false);
    setHoldProgress(0);
  };

  const togglePlayer = useCallback((id: string) => {
    setFormData((p) => {
      const exists = p.selectedPlayerIds.includes(id);
      const next = exists ? p.selectedPlayerIds.filter((x) => x !== id) : [...p.selectedPlayerIds, id];
      if (typeof navigator !== "undefined" && navigator.vibrate) navigator.vibrate(10);
      return { ...p, selectedPlayerIds: next };
    });
  }, []);

  // --- Fast Hold Logic ---
  const startHold = () => {
    if (!formData.subcategoryId || successAnim) return;
    
    setIsHolding(true);
    startTimeRef.current = Date.now();
    
    if (typeof navigator !== "undefined" && navigator.vibrate) navigator.vibrate(15);

    const duration = 350; 

    const animate = () => {
      const elapsed = Date.now() - startTimeRef.current;
      const p = Math.min((elapsed / duration) * 100, 100);
      setHoldProgress(p);

      if (p < 100) {
        animationFrameRef.current = requestAnimationFrame(animate);
      } else {
        triggerSubmit();
      }
    };
    
    animationFrameRef.current = requestAnimationFrame(animate);
  };

  const endHold = () => {
    if (holdProgress < 100 && !successAnim) {
      setIsHolding(false);
      setHoldProgress(0);
      cancelAnimationFrame(animationFrameRef.current);
    }
  };

  const triggerSubmit = () => {
    setIsHolding(false);
    setSuccessAnim(true);
    if (typeof navigator !== "undefined" && navigator.vibrate) navigator.vibrate([50, 30, 50]);

    mutation.mutate({
      playerIds: formData.selectedPlayerIds,
      subcategoryId: formData.subcategoryId,
      amount: formData.amount,
      description: formData.description,
    });
  };

  // --- Helpers ---
  const getCardName = (p: User) => (p.nickname?.trim() ? p.nickname : (p.lastName || p.firstName || "Unknown"));
  const initials = (p: User) => `${(p.firstName?.[0] || "")}${p.lastName?.[0] || ""}`.toUpperCase();
  const avatarColor = (id: string) => {
    const colors = ["bg-rose-100 text-rose-700", "bg-blue-100 text-blue-700", "bg-emerald-100 text-emerald-700", "bg-amber-100 text-amber-700"];
    let sum = 0;
    for (let i = 0; i < id.length; i++) sum += id.charCodeAt(i);
    return colors[sum % colors.length];
  };

  // --- Render ---
  return (
    <div className="relative flex flex-col h-[calc(100dvh-135px)] bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      
      {/* Header: Search + Distinct Clear Button */}
      <div className="shrink-0 px-4 py-3 z-10 flex gap-2">
         <div className="relative flex-1">
           <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
           <input
             type="text"
             placeholder="Search players..."
             value={playerSearchTerm}
             onChange={(e) => setPlayerSearchTerm(e.target.value)}
             className="w-full pl-10 pr-8 py-3 rounded-xl bg-slate-100/80 border-none focus:bg-white focus:ring-2 focus:ring-slate-200 outline-none transition-all text-sm font-medium text-slate-800"
           />
           {/* X button inside input: CLEARS TEXT ONLY */}
           {playerSearchTerm && (
             <button 
               onClick={() => setPlayerSearchTerm("")}
               className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-slate-600"
             >
               <X className="w-4 h-4" />
             </button>
           )}
         </div>

         {/* Separate Reset Button: CLEARS PLAYERS */}
         <AnimatePresence>
           {selectedCount > 0 && (
             <motion.button
               initial={{ width: 0, opacity: 0 }}
               animate={{ width: "auto", opacity: 1 }}
               exit={{ width: 0, opacity: 0 }}
               onClick={() => setFormData(p => ({ ...p, selectedPlayerIds: [] }))}
               className="shrink-0 bg-rose-50 hover:bg-rose-100 text-rose-600 px-3 rounded-xl text-xs font-bold flex items-center gap-1 overflow-hidden whitespace-nowrap"
             >
               <Trash2 className="w-3.5 h-3.5" />
               <span>({selectedCount})</span>
             </motion.button>
           )}
         </AnimatePresence>
      </div>

      {/* Player Grid */}
      <ScrollArea className="flex-1 px-2">
        <div className="grid grid-cols-4 sm:grid-cols-5 gap-y-4 gap-x-2 pb-24 pt-2">
          {filteredPlayers.length === 0 ? (
             <div className="col-span-full py-12 flex flex-col items-center text-slate-400">
                <Filter className="w-8 h-8 mb-2 opacity-20" />
                <span className="text-sm font-medium">No players found</span>
             </div>
          ) : (
            filteredPlayers.map((player) => {
              const selected = selectedPlayersSet.has(player.id);
              return (
                <motion.button
                  key={player.id}
                  layout
                  onClick={() => togglePlayer(player.id)}
                  whileTap={{ scale: 0.92 }}
                  className="flex flex-col items-center gap-1 outline-none relative group"
                >
                   <div className={`relative w-14 h-14 rounded-full flex items-center justify-center transition-all duration-200
                     ${player.profileImageUrl ? "bg-slate-50" : avatarColor(player.id)}
                     ${selected ? "ring-2 ring-offset-2 ring-rose-500" : "grayscale-[0.3]"}
                   `}>
                     {player.profileImageUrl ? (
                       <img src={player.profileImageUrl} alt="" className="w-full h-full rounded-full object-cover" />
                     ) : (
                       <span className="text-sm font-bold">{initials(player)}</span>
                     )}

                     <AnimatePresence>
                       {selected && (
                         <motion.div 
                           initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
                           className="absolute -bottom-0.5 -right-0.5 bg-rose-500 text-white rounded-full p-[2px] ring-2 ring-white z-10"
                         >
                           <Check className="w-3 h-3" strokeWidth={3} />
                         </motion.div>
                       )}
                     </AnimatePresence>
                   </div>
                   <span className={`text-[11px] font-medium truncate w-full text-center px-1 ${selected ? "text-rose-600 font-bold" : "text-slate-600"}`}>
                     {getCardName(player)}
                   </span>
                </motion.button>
              );
            })
          )}
        </div>
      </ScrollArea>

      {/* Next Button */}
      <AnimatePresence>
        {selectedCount > 0 && !isSheetOpen && (
          <motion.div
            initial={{ y: 100 }} animate={{ y: 0 }} exit={{ y: 100 }}
            className="absolute bottom-4 left-4 right-4 z-20"
          >
            <button
              onClick={() => setIsSheetOpen(true)}
              className="w-full h-14 bg-slate-900 text-white rounded-2xl shadow-xl shadow-slate-900/20 flex items-center justify-between px-5 active:scale-95 transition-transform"
            >
              <div className="flex items-center gap-3">
                <div className="bg-rose-600 text-white text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
                  <UserIcon className="w-3 h-3" />
                  {selectedCount}
                </div>
                <span className="text-sm font-medium text-slate-200">Selected</span>
              </div>
              <div className="flex items-center gap-2 text-sm font-bold text-white">
                Next <ArrowRight className="w-4 h-4" />
              </div>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Drawer */}
      <AnimatePresence>
        {isSheetOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsSheetOpen(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-[2px] z-30"
            />
            
            <motion.div
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl z-40 shadow-2xl flex flex-col max-h-[85%] overflow-hidden"
            >
              {/* Drawer Header */}
              <div className="shrink-0 flex items-center justify-between px-6 py-4 bg-white border-b border-slate-50">
                <div className="flex items-center gap-2 font-bold text-slate-800 text-lg">
                  <Gavel className="w-5 h-5 text-rose-600" />
                  <span>Issue Fine</span>
                </div>
                <button onClick={() => setIsSheetOpen(false)} className="p-2 bg-slate-50 rounded-full hover:bg-slate-100">
                  <ChevronDown className="w-5 h-5 text-slate-400" />
                </button>
              </div>

              <div className="overflow-y-auto px-6 pb-8 space-y-6 pt-4">
                
                {/* A. Minimalist Standard Select (Clean, Professional) */}
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase mb-2 block tracking-wider">Fine Category</label>
                  <div className="relative group">
                    <select
                      value={formData.categoryId}
                      onChange={(e) => setFormData(p => ({ ...p, categoryId: e.target.value }))}
                      className="w-full appearance-none bg-white text-slate-900 text-base font-semibold rounded-xl p-4 pr-10 border border-slate-200 focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none transition-all cursor-pointer shadow-sm"
                    >
                      {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                    
                    {/* Custom Icon */}
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                      <ChevronDown className="w-5 h-5 text-slate-500" />
                    </div>
                  </div>
                </div>

                {/* B. Subcategories */}
                {formData.categoryId && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase block tracking-wider">Fine Reason</label>
                    <div className="flex flex-wrap gap-2">
                      {subcategories.map(s => {
                        const active = formData.subcategoryId === s.id;
                        return (
                          <button
                            key={s.id}
                            onClick={() => setFormData((p) => ({ ...p, subcategoryId: s.id, amount: String(s.defaultAmount) }))}
                            className={`px-3.5 py-2.5 rounded-lg text-xs font-bold border transition-all duration-200 ${
                              active
                                ? "bg-slate-800 text-white border-slate-800 shadow-md transform scale-[1.02]"
                                : "bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                            }`}
                          >
                            {s.name}
                          </button>
                        );
                      })}
                    </div>
                  </motion.div>
                )}

                {/* C. Details (Sticky) */}
                {formData.subcategoryId && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-2 pt-1">
                    <div className="flex gap-3">
                      <div className="w-1/3 relative shrink-0">
                         <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">£</span>
                         <Input 
                            type="number" 
                            value={formData.amount} 
                            onChange={e => setFormData(p => ({...p, amount: e.target.value}))}
                            className="pl-7 bg-slate-50 font-bold text-slate-900 border-slate-200 h-12 text-lg"
                         />
                      </div>
                      <div className="flex-1 relative">
                        <Input 
                          placeholder="Note (e.g. vs Team X)" 
                          value={formData.description}
                          onChange={e => setFormData(p => ({...p, description: e.target.value}))}
                          className="bg-slate-50 border-slate-200 h-12 text-sm pr-8"
                        />
                        {formData.description && (
                          <div className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none">
                            <History className="w-4 h-4" />
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}

                <div className="h-2" />

                {/* D. Fast Action Button */}
                <div className="relative w-full select-none touch-none">
                   <motion.div
                    className={`relative w-full h-16 rounded-2xl overflow-hidden cursor-pointer shadow-md transition-all
                      ${successAnim ? "bg-green-500" : "bg-slate-900 active:scale-[0.98]"}
                    `}
                    onPointerDown={startHold}
                    onPointerUp={endHold}
                    onPointerLeave={endHold}
                    onClick={() => { if(!isHolding && !successAnim) startHold(); }}
                   >
                      {!successAnim && (
                        <motion.div 
                          className="absolute inset-0 bg-gradient-to-r from-rose-600 via-rose-500 to-rose-600 z-0"
                          style={{ width: `${holdProgress}%` }}
                        />
                      )}
                      <div className="absolute inset-0 flex items-center justify-center gap-3 z-10 pointer-events-none">
                        {successAnim ? (
                          <motion.div 
                            initial={{ scale: 0.5, opacity: 0 }} 
                            animate={{ scale: 1.2, opacity: 1, rotate: [0, -10, 10, 0] }} 
                            className="flex items-center gap-2 text-white font-black text-xl tracking-wider"
                          >
                            <Gavel className="w-8 h-8" /> ISSUED!
                          </motion.div>
                        ) : (
                          <div className="flex flex-col items-center justify-center text-white">
                             <div className="flex items-center gap-2 font-bold text-lg">
                               <Zap className={`w-5 h-5 ${isHolding ? "animate-pulse text-yellow-300" : "text-rose-500"}`} fill="currentColor" />
                               {isHolding ? "CONFIRMING..." : "HOLD TO ISSUE"}
                             </div>
                             {selectedSub && <div className="text-[10px] opacity-70 font-medium">£{formData.amount} Fine</div>}
                          </div>
                        )}
                      </div>
                   </motion.div>
                </div>

              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
