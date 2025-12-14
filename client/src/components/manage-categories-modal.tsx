import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Plus, Tags, Edit2, Trash2, PoundSterling, GripVertical } from "lucide-react";
import type { FineCategory, FineSubcategory } from "@shared/schema";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface ManageCategoriesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface SortableCategoryCardProps {
  category: FineCategory & { subcategoryCount?: number };
  isSelected: boolean;
  onSelect: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

function SortableCategoryCard({ category, isSelected, onSelect, onEdit, onDelete }: SortableCategoryCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: category.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
  };

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={`cursor-pointer transition-all ${isSelected ? 'ring-2 ring-primary' : ''} ${isDragging ? 'z-50' : ''}`}
      onClick={onSelect}
    >
      <CardContent className="p-3">
        <div className="flex items-center gap-3">
          <div
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing p-1 rounded"
            aria-hidden
          >
            <GripVertical className="w-4 h-4 text-slate-400" />
          </div>
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: category.color }}>
              <Tags className="w-4 h-4 text-white" />
            </div>
            <div className="min-w-0">
              <p className="font-medium text-sm truncate">{category.name}</p>
              <p className="text-xs text-muted-foreground">
                {category.subcategoryCount ?? 0} subcategor{(category.subcategoryCount ?? 0) !== 1 ? 'ies' : 'y'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <Button
              size="sm"
              variant="ghost"
              onClick={(e) => { e.stopPropagation(); onEdit(); }}
              className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
              aria-label={`Edit ${category.name}`}
            >
              <Edit2 className="w-4 h-4" />
            </Button>

            <Button
              size="sm"
              variant="ghost"
              onClick={(e) => { e.stopPropagation(); onDelete(); }}
              className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
              aria-label={`Delete ${category.name}`}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface SortableSubcategoryCardProps {
  subcategory: FineSubcategory;
  onEdit: () => void;
  onDelete: () => void;
}

function SortableSubcategoryCard({ subcategory, onEdit, onDelete }: SortableSubcategoryCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: subcategory.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
  };

  return (
    <Card ref={setNodeRef} style={style} className={`${isDragging ? 'z-50' : ''}`}>
      <CardContent className="p-3">
        <div className="flex items-start gap-3">
          <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing p-1 rounded" aria-hidden>
            <GripVertical className="w-4 h-4 text-slate-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm truncate">{subcategory.name}</p>
            <p className="text-xs text-muted-foreground">Default: £{parseFloat(subcategory.defaultAmount || "0").toFixed(2)}</p>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={onEdit} className="h-8 w-8 p-0">
              <Edit2 className="w-4 h-4" />
            </Button>
            <Button size="sm" variant="outline" onClick={onDelete} className="h-8 w-8 p-0 text-red-600">
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function ManageCategoriesModal({ isOpen, onClose }: ManageCategoriesModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [showSubcategoryForm, setShowSubcategoryForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<FineCategory | null>(null);
  const [editingSubcategory, setEditingSubcategory] = useState<FineSubcategory | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ type: 'category' | 'subcategory'; id: string; name?: string } | null>(null);

  // Forms
  const [categoryForm, setCategoryForm] = useState({ name: "", color: "#1E40AF" });
  const [subcategoryForm, setSubcategoryForm] = useState({ name: "", defaultAmount: "0.00" });

  // Data
  const { data: categories = [], isLoading: categoriesLoading } = useQuery<(FineCategory & { subcategoryCount?: number })[]>({
    queryKey: ["/api/categories"],
    enabled: isOpen,
    keepPreviousData: true,
  });

  const { data: subcategories = [], isLoading: subcategoriesLoading } = useQuery<FineSubcategory[]>({
    queryKey: ["/api/categories", selectedCategoryId, "subcategories"],
    enabled: isOpen && !!selectedCategoryId,
    keepPreviousData: true,
  });

  // Mutations
  const createCategory = useMutation({
    mutationFn: (payload: any) => apiRequest("POST", "/api/categories", payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      toast({ title: "Category Created", description: "Category successfully created." });
      setShowCategoryForm(false);
      setCategoryForm({ name: "", color: "#1E40AF" });
      setEditingCategory(null);
    },
    onError: (err) => {
      toast({ title: "Error", description: err instanceof Error ? err.message : "Failed to create category", variant: "destructive" });
    },
  });

  const updateCategory = useMutation({
    mutationFn: (payload: { id: string; name: string; color: string }) => apiRequest("PATCH", `/api/categories/${payload.id}`, { name: payload.name, color: payload.color }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      toast({ title: "Category Updated", description: "Category updated." });
      setShowCategoryForm(false);
      setEditingCategory(null);
      setCategoryForm({ name: "", color: "#1E40AF" });
    },
    onError: (err) => {
      toast({ title: "Error", description: err instanceof Error ? err.message : "Failed to update category", variant: "destructive" });
    },
  });

  const deleteCategory = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/categories/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      toast({ title: "Category Deleted", description: "Category removed." });
      setDeleteConfirm(null);
      setSelectedCategoryId(null);
    },
    onError: (err) => {
      toast({ title: "Error", description: err instanceof Error ? err.message : "Failed to delete category", variant: "destructive" });
    },
  });

  const createSubcategory = useMutation({
    mutationFn: (payload: any) => apiRequest("POST", `/api/categories/${selectedCategoryId}/subcategories`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/categories", selectedCategoryId, "subcategories"] });
      toast({ title: "Subcategory Created", description: "Subcategory added." });
      setShowSubcategoryForm(false);
      setSubcategoryForm({ name: "", defaultAmount: "0.00" });
    },
    onError: (err) => {
      toast({ title: "Error", description: err instanceof Error ? err.message : "Failed to create subcategory", variant: "destructive" });
    },
  });

  const updateSubcategory = useMutation({
    mutationFn: (payload: { id: string; name: string; defaultAmount: string }) => apiRequest("PATCH", `/api/subcategories/${payload.id}`, { name: payload.name, defaultAmount: payload.defaultAmount }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/categories", selectedCategoryId, "subcategories"] });
      toast({ title: "Subcategory Updated", description: "Subcategory updated." });
      setShowSubcategoryForm(false);
      setEditingSubcategory(null);
      setSubcategoryForm({ name: "", defaultAmount: "0.00" });
    },
    onError: (err) => {
      toast({ title: "Error", description: err instanceof Error ? err.message : "Failed to update subcategory", variant: "destructive" });
    },
  });

  const deleteSubcategory = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/subcategories/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/categories", selectedCategoryId, "subcategories"] });
      toast({ title: "Subcategory Deleted", description: "Subcategory removed." });
      setDeleteConfirm(null);
    },
    onError: (err) => {
      toast({ title: "Error", description: err instanceof Error ? err.message : "Failed to delete subcategory", variant: "destructive" });
    },
  });

  const reorderCategories = useMutation({
    mutationFn: (ids: string[]) => apiRequest("PATCH", "/api/categories/reorder", { categoryIds: ids }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
    },
    onError: (err) => {
      toast({ title: "Error", description: "Failed to reorder categories", variant: "destructive" });
    },
  });

  const reorderSubcategories = useMutation({
    mutationFn: (ids: string[]) => apiRequest("PATCH", `/api/categories/${selectedCategoryId}/subcategories/reorder`, { subcategoryIds: ids }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/categories", selectedCategoryId, "subcategories"] });
    },
    onError: (err) => {
      toast({ title: "Error", description: "Failed to reorder subcategories", variant: "destructive" });
    },
  });

  // drag handlers
  const handleCategoryDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;
    if (active.id !== over.id) {
      const oldIndex = categories.findIndex(c => c.id === active.id);
      const newIndex = categories.findIndex(c => c.id === over.id);
      if (oldIndex === -1 || newIndex === -1) return;
      const newOrder = arrayMove(categories, oldIndex, newIndex);
      reorderCategories.mutate(newOrder.map(c => c.id));
    }
  };

  const handleSubcategoryDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;
    if (active.id !== over.id) {
      const oldIndex = subcategories.findIndex(s => s.id === active.id);
      const newIndex = subcategories.findIndex(s => s.id === over.id);
      if (oldIndex === -1 || newIndex === -1) return;
      const newOrder = arrayMove(subcategories, oldIndex, newIndex);
      reorderSubcategories.mutate(newOrder.map(s => s.id));
    }
  };

  // helpers
  useEffect(() => {
    if (!selectedCategoryId && categories.length > 0) {
      setSelectedCategoryId(categories[0].id);
    }
  }, [categories, selectedCategoryId]);

  const startEditCategory = (category: FineCategory) => {
    setEditingCategory(category);
    setCategoryForm({ name: category.name, color: category.color || "#1E40AF" });
    setShowCategoryForm(true);
  };

  const startEditSubcategory = (subcategory: FineSubcategory) => {
    setEditingSubcategory(subcategory);
    setSubcategoryForm({ name: subcategory.name, defaultAmount: subcategory.defaultAmount || "0.00" });
    setShowSubcategoryForm(true);
  };

  // submit handlers
  const submitCategory = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!categoryForm.name.trim()) {
      toast({ title: "Missing", description: "Category name required", variant: "destructive" });
      return;
    }
    if (editingCategory) {
      updateCategory.mutate({ id: editingCategory.id, name: categoryForm.name, color: categoryForm.color });
    } else {
      createCategory.mutate(categoryForm);
    }
  };

  const submitSubcategory = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!selectedCategoryId) {
      toast({ title: "Select category", description: "Please select a category first", variant: "destructive" });
      return;
    }
    if (!subcategoryForm.name.trim()) {
      toast({ title: "Missing", description: "Subcategory name required", variant: "destructive" });
      return;
    }
    if (!/^\d+(\.\d{1,2})?$/.test(subcategoryForm.defaultAmount)) {
      toast({ title: "Invalid amount", description: "Default amount must be a number (max 2 decimals)", variant: "destructive" });
      return;
    }
    if (editingSubcategory) {
      updateSubcategory.mutate({ id: editingSubcategory.id, name: subcategoryForm.name, defaultAmount: subcategoryForm.defaultAmount });
    } else {
      createSubcategory.mutate({ name: subcategoryForm.name, defaultAmount: subcategoryForm.defaultAmount });
    }
  };

  const confirmDelete = () => {
    if (!deleteConfirm) return;
    if (deleteConfirm.type === 'category') deleteCategory.mutate(deleteConfirm.id);
    else deleteSubcategory.mutate(deleteConfirm.id);
  };

  // small UI currency helper
  const formatCurrencyUI = (amt: string) => {
    const n = parseFloat(amt || "0");
    if (isNaN(n)) return "£0.00";
    return `£${n.toFixed(2)}`;
  };

  // Render
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-full max-w-[95vw] sm:max-w-4xl max-h-[95vh] overflow-hidden flex flex-col p-3 sm:p-6 bg-white dark:bg-slate-800 border-border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg sm:text-xl">
            <Tags className="w-5 h-5" />
            <span>Fine Types</span>
          </DialogTitle>
        </DialogHeader>

        <div className="overflow-y-auto flex-1 pr-2 -mr-2">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* Left column: categories */}
            <div className="lg:col-span-5">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                <h3 className="text-lg font-semibold min-w-0 truncate">Categories</h3>
                <Button onClick={() => { setShowCategoryForm(true); setEditingCategory(null); }} size="sm" className="flex items-center gap-2 flex-shrink-0">
                  <Plus className="w-4 h-4" /> <span>Add</span>
                </Button>
              </div>

              {/* Category form (collapsible) */}
              {showCategoryForm && (
                <Card className="mb-3">
                  <CardContent className="p-3">
                    <form onSubmit={submitCategory} className="space-y-3">
                      <div>
                        <Label htmlFor="catName">Name</Label>
                        <Input id="catName" value={categoryForm.name} onChange={(e) => setCategoryForm(prev => ({ ...prev, name: e.target.value }))} placeholder="e.g., Training" />
                      </div>
                      <div>
                        <Label htmlFor="catColor">Colour</Label>
                        <Input id="catColor" type="color" value={categoryForm.color} onChange={(e) => setCategoryForm(prev => ({ ...prev, color: e.target.value }))} className="h-9 w-20 p-0" />
                      </div>

                      <div className="flex gap-2">
                        <Button type="submit" disabled={createCategory.isPending || updateCategory.isPending}>
                          {editingCategory ? (updateCategory.isPending ? "Updating..." : "Update") : (createCategory.isPending ? "Creating..." : "Create")}
                        </Button>
                        <Button variant="outline" onClick={() => { setShowCategoryForm(false); setEditingCategory(null); setCategoryForm({ name: "", color: "#1E40AF" }); }}>
                          Cancel
                        </Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              )}

              {/* Categories list */}
              <div className="space-y-3">
                {categoriesLoading ? (
                  <div className="text-center py-6">
                    <div className="animate-spin w-6 h-6 border-4 border-primary border-t-transparent rounded-full mx-auto" />
                    <p className="text-sm text-muted-foreground mt-2">Loading...</p>
                  </div>
                ) : categories.length === 0 ? (
                  <div className="text-center py-6 text-muted-foreground">
                    <p>No categories yet. Add one to get started.</p>
                  </div>
                ) : (
                  <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleCategoryDragEnd}>
                    <SortableContext items={categories.map(c => c.id)} strategy={verticalListSortingStrategy}>
                      <div className="space-y-2">
                        {categories.map((cat) => (
                          <SortableCategoryCard
                            key={cat.id}
                            category={cat}
                            isSelected={selectedCategoryId === cat.id}
                            onSelect={() => setSelectedCategoryId(cat.id)}
                            onEdit={() => startEditCategory(cat)}
                            onDelete={() => setDeleteConfirm({ type: 'category', id: cat.id, name: cat.name })}
                          />
                        ))}
                      </div>
                    </SortableContext>
                  </DndContext>
                )}
              </div>
            </div>

            {/* Right column: subcategories */}
            <div className="lg:col-span-7">
              <div className="flex flex-wrap items-start justify-between gap-2 mb-3">
                <div className="min-w-0 flex-1">
                  <h3 className="text-base sm:text-lg font-semibold truncate">
                    Subcategories{selectedCategoryId ? ` — ${categories.find(c => c.id === selectedCategoryId)?.name}` : ''}
                  </h3>
                  <p className="text-xs text-muted-foreground">Click a category on the left to manage its subcategories.</p>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <Button size="sm" variant="outline" onClick={() => { if (selectedCategoryId) setShowSubcategoryForm(true); else toast({ title: "No category selected", description: "Please select a category first", variant: "destructive" }); }} className="text-xs sm:text-sm">
                    <Plus className="w-4 h-4 mr-1" /> <span className="hidden sm:inline">Add Subcategory</span><span className="sm:hidden">Add</span>
                  </Button>
                  {selectedCategoryId && (
                    <Button size="sm" variant="ghost" onClick={() => setDeleteConfirm({ type: 'category', id: selectedCategoryId, name: categories.find(c => c.id === selectedCategoryId)?.name })} className="text-red-600 flex-shrink-0">
                      <Trash2 className="w-4 h-4" /> <span className="sr-only">Delete category</span>
                    </Button>
                  )}
                </div>
              </div>

              {/* Subcategory form */}
              {showSubcategoryForm && (
                <Card className="mb-3">
                  <CardContent className="p-3">
                    <form onSubmit={submitSubcategory} className="space-y-3">
                      <div>
                        <Label htmlFor="subName">Name</Label>
                        <Input id="subName" value={subcategoryForm.name} onChange={(e) => setSubcategoryForm(prev => ({ ...prev, name: e.target.value }))} placeholder="e.g., Late Arrival" />
                      </div>
                      <div>
                        <Label htmlFor="subAmount">Default Amount (£)</Label>
                        <Input id="subAmount" type="number" min="0" step="0.01" value={subcategoryForm.defaultAmount} onChange={(e) => setSubcategoryForm(prev => ({ ...prev, defaultAmount: e.target.value }))} />
                      </div>

                      <div className="flex gap-2">
                        <Button type="submit" disabled={createSubcategory.isPending || updateSubcategory.isPending}>
                          {editingSubcategory ? (updateSubcategory.isPending ? "Updating..." : "Update") : (createSubcategory.isPending ? "Creating..." : "Create")}
                        </Button>
                        <Button variant="outline" onClick={() => { setShowSubcategoryForm(false); setEditingSubcategory(null); setSubcategoryForm({ name: "", defaultAmount: "0.00" }); }}>
                          Cancel
                        </Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              )}

              {/* Subcategories list */}
              <div className="space-y-2">
                {selectedCategoryId && subcategoriesLoading ? (
                  <div className="text-center py-6">
                    <div className="animate-spin w-6 h-6 border-4 border-primary border-t-transparent rounded-full mx-auto" />
                    <p className="text-sm text-muted-foreground mt-2">Loading subcategories...</p>
                  </div>
                ) : selectedCategoryId && subcategories.length === 0 ? (
                  <div className="text-center py-6 text-muted-foreground">
                    <PoundSterling className="w-12 h-12 mx-auto mb-3 text-slate-400" />
                    <p>No subcategories for this category yet.</p>
                  </div>
                ) : selectedCategoryId ? (
                  <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleSubcategoryDragEnd}>
                    <SortableContext items={subcategories.map(s => s.id)} strategy={verticalListSortingStrategy}>
                      <div className="space-y-2">
                        {subcategories.map((sub) => (
                          <SortableSubcategoryCard
                            key={sub.id}
                            subcategory={sub}
                            onEdit={() => startEditSubcategory(sub)}
                            onDelete={() => setDeleteConfirm({ type: 'subcategory', id: sub.id, name: sub.name })}
                          />
                        ))}
                      </div>
                    </SortableContext>
                  </DndContext>
                ) : (
                  <div className="text-center py-6 text-muted-foreground">
                    <p>Select a category to view subcategories.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Delete confirmation */}
        <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete {deleteConfirm?.type === 'category' ? 'Category' : 'Subcategory'}</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete "{deleteConfirm?.name}"? {deleteConfirm?.type === 'category' && 'This will also delete all subcategories within it.'}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">Delete</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </DialogContent>
    </Dialog>
  );
}