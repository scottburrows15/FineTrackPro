import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Plus, Edit2, Trash2, GripVertical, X, ChevronLeft, Check, Tags, Layers, ArrowRight, Search } from "lucide-react";
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { cn } from "@/lib/utils";

const PRESET_COLORS = ["#1E40AF", "#3b82f6", "#10b981", "#ef4444", "#f59e0b", "#8b5cf6", "#64748b", "#000000"];

function SortableItem({ id, data, type, onSelect, onEdit, onDelete }: any) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  
  const style = { 
    transform: CSS.Transform.toString(transform), 
    transition, 
    opacity: isDragging ? 0.5 : 1, 
    zIndex: isDragging ? 50 : 1 
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={onSelect ? () => onSelect(data) : undefined}
      className={cn(
        "group relative flex items-start gap-2 p-3 rounded-xl border transition-all mb-2 select-none",
        onSelect ? "cursor-pointer active:scale-[0.99]" : "",
        isDragging 
          ? "bg-white shadow-xl ring-2 ring-blue-500 border-transparent z-50 scale-[1.02]" 
          : "bg-slate-50 border-transparent hover:border-blue-100 hover:bg-white"
      )}
    >
      {/* Drag Handle - Aligned to top */}
      <div 
        {...attributes} 
        {...listeners} 
        className="w-6 h-8 flex items-center justify-center cursor-grab hover:bg-slate-200/50 rounded-md shrink-0 mt-0.5" 
        onClick={(e) => e.stopPropagation()}
      >
        <GripVertical className="w-3.5 h-3.5 text-slate-300" />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 min-w-0 flex items-start gap-3">
        {type === 'category' && (
          <div 
            className="h-9 w-9 rounded-lg flex items-center justify-center shadow-sm border border-white shrink-0 mt-0.5"
            style={{ backgroundColor: data.color }}
          >
            <Tags className="w-4 h-4 text-white opacity-90" />
          </div>
        )}

        <div className="flex-1 min-w-0 py-0.5">
          <div className="text-sm font-bold text-slate-900 leading-snug break-words">
            {data.name}
          </div>
          {type === 'category' && (
            <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wide mt-1">
              {data.subcategoryCount || 0} Options
            </p>
          )}
        </div>
      </div>

      {/* Value & Actions - Pinned to right */}
      <div className="flex items-center gap-1 shrink-0 ml-2 mt-0.5">
        {type === 'subcategory' && (
          <span className="bg-white text-slate-900 font-black text-[11px] px-2 py-1 rounded-lg border border-slate-200 shadow-sm mr-1 whitespace-nowrap">
            £{parseFloat(data.defaultAmount || 0).toFixed(2)}
          </span>
        )}
        
        <div className="flex items-center">
          <Button size="icon" variant="ghost" className="h-8 w-8 rounded-lg text-slate-400 hover:text-blue-600" onClick={(e) => { e.stopPropagation(); onEdit(data); }}>
            <Edit2 className="w-3.5 h-3.5" />
          </Button>
          <Button size="icon" variant="ghost" className="h-8 w-8 rounded-lg text-slate-400 hover:text-red-600" onClick={(e) => { e.stopPropagation(); onDelete(data); }}>
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
          {onSelect && (
            <Button size="icon" variant="ghost" className="h-8 w-8 rounded-lg text-slate-300 hover:text-blue-600" onClick={(e) => { e.stopPropagation(); onSelect(data); }}>
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ManageCategoriesModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<any>(null); 
  const [deleteConfirm, setDeleteConfirm] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const { data: categories = [] } = useQuery<any[]>({ queryKey: ["/api/categories"], enabled: isOpen });
  const { data: subcategories = [] } = useQuery<any[]>({ queryKey: ["/api/categories", selectedCategoryId, "subcategories"], enabled: !!selectedCategoryId });

  const filteredCategories = useMemo(() => 
    categories.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase())), 
    [categories, searchQuery]
  );

  const saveMutation = useMutation({
    mutationFn: (data: any) => {
      const isSub = 'defaultAmount' in data;
      const url = isSub ? (data.id ? `/api/subcategories/${data.id}` : `/api/categories/${selectedCategoryId}/subcategories`) : (data.id ? `/api/categories/${data.id}` : `/api/categories`);
      return apiRequest(data.id ? "PATCH" : "POST", url, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      if (selectedCategoryId) queryClient.invalidateQueries({ queryKey: ["/api/categories", selectedCategoryId, "subcategories"] });
      setEditingItem(null);
      toast({ title: "Saved successfully" });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (data: any) => apiRequest("DELETE", 'defaultAmount' in data ? `/api/subcategories/${data.id}` : `/api/categories/${data.id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      if (selectedCategoryId) queryClient.invalidateQueries({ queryKey: ["/api/categories", selectedCategoryId, "subcategories"] });
      setDeleteConfirm(null);
      toast({ title: "Deleted successfully" });
    }
  });

  const handleDragEnd = (event: DragEndEvent, list: any[], mutationFn: any) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = list.findIndex(i => i.id === active.id);
      const newIndex = list.findIndex(i => i.id === over.id);
      mutationFn(arrayMove(list, oldIndex, newIndex).map(i => i.id));
    }
  };

  const reorderCats = useMutation({ mutationFn: (ids: string[]) => apiRequest("PATCH", "/api/categories/reorder", { categoryIds: ids }) });
  const reorderSubs = useMutation({ mutationFn: (ids: string[]) => apiRequest("PATCH", `/api/categories/${selectedCategoryId}/subcategories/reorder`, { subcategoryIds: ids }) });

  const isSubView = !!selectedCategoryId;
  const currentCategory = categories.find(c => c.id === selectedCategoryId);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[480px] w-[94vw] p-0 overflow-hidden border-none shadow-2xl rounded-[28px] bg-white flex flex-col h-[85vh] max-h-[85vh] [&>button]:hidden">
        
        {/* HEADER */}
        <div className="bg-slate-50 p-5 border-b border-slate-100 shrink-0">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              {isSubView ? (
                 <Button variant="ghost" size="icon" onClick={() => setSelectedCategoryId(null)} className="w-10 h-10 rounded-xl bg-white border border-slate-200 shadow-sm text-slate-500 hover:text-blue-600 hover:border-blue-200"><ChevronLeft className="w-5 h-5" /></Button>
              ) : (
                <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center shrink-0 shadow-sm"><Layers className="w-5 h-5 text-white" /></div>
              )}
              <div className="min-w-0 text-left">
                <DialogTitle className="text-lg font-black tracking-tight leading-none truncate text-slate-900">{isSubView ? currentCategory?.name : "Fine Architecture"}</DialogTitle>
                <DialogDescription className="text-[10px] font-bold text-slate-400 uppercase tracking-tight mt-1">{isSubView ? "Manage Options" : "Categories & Types"}</DialogDescription>
              </div>
            </div>
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-slate-400 hover:bg-slate-200/50" onClick={onClose}><X className="w-4 h-4" /></Button>
          </div>
        </div>

        {/* SEARCH BAR */}
        {!isSubView && (
          <div className="px-5 pt-4 shrink-0">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
              <Input placeholder="Search categories..." className="h-9 pl-9 bg-slate-50 border-none rounded-xl text-xs font-medium shadow-inner" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
            </div>
          </div>
        )}

        {/* MAIN SCROLLABLE CONTENT */}
        <div className="flex-1 overflow-hidden relative">
          <div className="flex w-[200%] h-full transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]" style={{ transform: isSubView ? "translateX(-50%)" : "translateX(0)" }}>
            
            {/* PANEL 1: CATEGORIES */}
            <div className="w-1/2 h-full flex flex-col min-h-0">
              <div className="px-5 pt-4 pb-2 flex justify-between items-center shrink-0">
                 <h3 className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">Categories ({categories.length})</h3>
                 <Button size="sm" onClick={() => setEditingItem({ name: "", color: "#1E40AF" })} className="h-7 bg-blue-600 text-white font-bold text-[9px] uppercase tracking-wider rounded-lg px-3 hover:bg-blue-700 shadow-sm"><Plus className="w-3 h-3 mr-1" /> Add New</Button>
              </div>
              <div className="flex-1 overflow-y-auto px-5 pb-5 scrollbar-hide">
                {editingItem && !('defaultAmount' in editingItem) && (
                  <div className="p-3 mb-4 bg-slate-50 rounded-xl border border-blue-100 shadow-sm animate-in fade-in slide-in-from-top-2">
                    <div className="space-y-3">
                      <div className="space-y-1">
                        <Label className="text-[9px] font-black uppercase text-slate-400 ml-1">Category Name</Label>
                        <Input autoFocus value={editingItem.name} onChange={e => setEditingItem({...editingItem, name: e.target.value})} className="h-9 bg-white border-none rounded-lg font-bold text-sm" />
                      </div>
                      <div className="flex flex-wrap gap-2 p-1">
                        {PRESET_COLORS.map(c => (
                          <button key={c} onClick={() => setEditingItem({...editingItem, color: c})} className={cn("w-6 h-6 rounded-full", editingItem.color === c ? "ring-2 ring-blue-500 ring-offset-2 scale-110" : "opacity-40")} style={{ backgroundColor: c }} />
                        ))}
                      </div>
                      <div className="flex gap-2"><Button size="sm" className="flex-1 h-8 bg-blue-600 text-[9px] font-bold uppercase" onClick={() => saveMutation.mutate(editingItem)}>Save</Button><Button size="sm" variant="ghost" className="flex-1 h-8 text-[9px] font-bold uppercase" onClick={() => setEditingItem(null)}>Cancel</Button></div>
                    </div>
                  </div>
                )}
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={(e) => handleDragEnd(e, categories, reorderCats.mutate)}>
                  <SortableContext items={categories.map(c => c.id)} strategy={verticalListSortingStrategy}>
                    {filteredCategories.map(cat => <SortableItem key={cat.id} id={cat.id} data={cat} type="category" onSelect={(c: any) => setSelectedCategoryId(c.id)} onEdit={setEditingItem} onDelete={setDeleteConfirm} />)}
                  </SortableContext>
                </DndContext>
              </div>
            </div>

            {/* PANEL 2: SUBCATEGORIES */}
            <div className="w-1/2 h-full flex flex-col min-h-0">
              <div className="px-5 pt-4 pb-2 flex justify-between items-center shrink-0">
                 <h3 className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">Options ({subcategories.length})</h3>
                 <Button size="sm" onClick={() => setEditingItem({ name: "", defaultAmount: "0.00" })} className="h-7 bg-blue-600 text-white font-bold text-[9px] uppercase tracking-wider rounded-lg px-3 hover:bg-blue-700 shadow-sm"><Plus className="w-3 h-3 mr-1" /> Add New</Button>
              </div>
              <div className="flex-1 overflow-y-auto px-5 pb-5 scrollbar-hide">
                {editingItem && 'defaultAmount' in editingItem && (
                   <div className="p-3 mb-4 bg-slate-50 rounded-xl border border-blue-100 shadow-sm animate-in fade-in slide-in-from-top-2">
                    <div className="space-y-3">
                      <div className="space-y-1">
                        <Label className="text-[9px] font-black uppercase text-slate-400 ml-1">Option Name</Label>
                        <Input autoFocus value={editingItem.name} onChange={e => setEditingItem({...editingItem, name: e.target.value})} className="h-9 bg-white border-none rounded-lg font-bold text-sm" />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[9px] font-black uppercase text-slate-400 ml-1">Default Fine (£)</Label>
                        <Input type="number" step="0.01" value={editingItem.defaultAmount} onChange={e => setEditingItem({...editingItem, defaultAmount: e.target.value})} className="h-9 bg-white border-none rounded-lg font-bold text-sm" />
                      </div>
                      <div className="flex gap-2 pt-1"><Button size="sm" className="flex-1 h-8 bg-blue-600 text-[9px] font-bold uppercase" onClick={() => saveMutation.mutate(editingItem)}>Save</Button><Button size="sm" variant="ghost" className="flex-1 h-8 text-[9px] font-bold uppercase" onClick={() => setEditingItem(null)}>Cancel</Button></div>
                    </div>
                  </div>
                )}
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={(e) => handleDragEnd(e, subcategories, reorderSubs.mutate)}>
                  <SortableContext items={subcategories.map(s => s.id)} strategy={verticalListSortingStrategy}>
                    {subcategories.map(sub => <SortableItem key={sub.id} id={sub.id} data={sub} type="subcategory" onEdit={setEditingItem} onDelete={setDeleteConfirm} />)}
                  </SortableContext>
                </DndContext>
              </div>
            </div>
          </div>
        </div>

        {/* DELETE DIALOG */}
        <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
          <AlertDialogContent className="rounded-[28px] border-none">
            <AlertDialogHeader><AlertDialogTitle className="font-black text-lg text-slate-900 tracking-tight">Confirm Deletion</AlertDialogTitle><AlertDialogDescription className="font-medium text-slate-500">Are you sure you want to remove "{deleteConfirm?.name}"?</AlertDialogDescription></AlertDialogHeader>
            <AlertDialogFooter><AlertDialogCancel className="rounded-xl font-bold text-xs">Cancel</AlertDialogCancel><AlertDialogAction onClick={() => deleteMutation.mutate(deleteConfirm)} className="bg-red-600 hover:bg-red-700 rounded-xl font-bold text-xs">Delete</AlertDialogAction></AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

      </DialogContent>
    </Dialog>
  );
}
