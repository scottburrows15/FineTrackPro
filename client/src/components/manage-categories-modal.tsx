import { useState } from "react";
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
import { Plus, Tags, Edit, Trash2, PoundSterling, Edit2, GripVertical } from "lucide-react";
import type { FineCategory, FineSubcategory } from "@shared/schema";

interface ManageCategoriesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ManageCategoriesModal({ isOpen, onClose }: ManageCategoriesModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [showAddSubcategory, setShowAddSubcategory] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");
  const [editingCategory, setEditingCategory] = useState<FineCategory | null>(null);
  const [editingSubcategory, setEditingSubcategory] = useState<FineSubcategory | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{
    type: 'category' | 'subcategory';
    item: FineCategory | FineSubcategory;
  } | null>(null);
  
  const [categoryForm, setCategoryForm] = useState({
    name: "",
    color: "#1E40AF",
  });
  
  const [subcategoryForm, setSubcategoryForm] = useState({
    name: "",
    defaultAmount: "",
    icon: "fas fa-gavel",
  });

  // Fetch categories
  const { data: categories = [], isLoading: categoriesLoading } = useQuery<FineCategory[]>({
    queryKey: ["/api/categories"],
    enabled: isOpen,
  });

  // Fetch subcategories for selected category
  const { data: subcategories = [] } = useQuery<FineSubcategory[]>({
    queryKey: ["/api/categories", selectedCategoryId, "subcategories"],
    enabled: isOpen && !!selectedCategoryId,
  });

  // Create category mutation
  const createCategory = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("POST", "/api/categories", data);
    },
    onSuccess: () => {
      toast({
        title: "Category Created",
        description: "New fine category has been created successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      setShowAddCategory(false);
      setCategoryForm({ name: "", color: "#1E40AF" });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create category",
        variant: "destructive",
      });
    },
  });

  // Create subcategory mutation
  const createSubcategory = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("POST", `/api/categories/${selectedCategoryId}/subcategories`, data);
    },
    onSuccess: () => {
      toast({
        title: "Subcategory Created",
        description: "New fine subcategory has been created successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/categories", selectedCategoryId, "subcategories"] });
      setShowAddSubcategory(false);
      setSubcategoryForm({ name: "", defaultAmount: "", icon: "fas fa-gavel" });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create subcategory",
        variant: "destructive",
      });
    },
  });

  // Update category mutation
  const updateCategory = useMutation({
    mutationFn: async (data: { id: string; name: string; color: string }) => {
      return await apiRequest("PATCH", `/api/categories/${data.id}`, {
        name: data.name,
        color: data.color,
      });
    },
    onSuccess: () => {
      toast({
        title: "Category Updated",
        description: "Category has been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      setEditingCategory(null);
      setCategoryForm({ name: "", color: "#1E40AF" });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update category",
        variant: "destructive",
      });
    },
  });

  // Update subcategory mutation
  const updateSubcategory = useMutation({
    mutationFn: async (data: { id: string; name: string; defaultAmount: string; icon: string }) => {
      return await apiRequest("PATCH", `/api/subcategories/${data.id}`, {
        name: data.name,
        defaultAmount: data.defaultAmount,
        icon: data.icon,
      });
    },
    onSuccess: () => {
      toast({
        title: "Subcategory Updated",
        description: "Subcategory has been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/categories", selectedCategoryId, "subcategories"] });
      setEditingSubcategory(null);
      setSubcategoryForm({ name: "", defaultAmount: "", icon: "fas fa-gavel" });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update subcategory",
        variant: "destructive",
      });
    },
  });

  // Delete category mutation
  const deleteCategory = useMutation({
    mutationFn: async (categoryId: string) => {
      return await apiRequest("DELETE", `/api/categories/${categoryId}`);
    },
    onSuccess: () => {
      toast({
        title: "Category Deleted",
        description: "Fine category has been deleted successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      setDeleteConfirm(null);
      setSelectedCategoryId("");
    },
    onError: (error) => {
      toast({
        title: "Error", 
        description: error instanceof Error ? error.message : "Failed to delete category",
        variant: "destructive",
      });
    },
  });

  // Delete subcategory mutation
  const deleteSubcategory = useMutation({
    mutationFn: async (subcategoryId: string) => {
      return await apiRequest("DELETE", `/api/subcategories/${subcategoryId}`);
    },
    onSuccess: () => {
      toast({
        title: "Subcategory Deleted",
        description: "Fine subcategory has been deleted successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/categories", selectedCategoryId, "subcategories"] });
      setDeleteConfirm(null);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete subcategory", 
        variant: "destructive",
      });
    },
  });

  const handleCreateCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryForm.name.trim()) {
      toast({
        title: "Missing Information",
        description: "Please provide a category name.",
        variant: "destructive",
      });
      return;
    }
    
    if (editingCategory) {
      updateCategory.mutate({
        id: editingCategory.id,
        ...categoryForm,
      });
    } else {
      createCategory.mutate(categoryForm);
    }
  };

  const handleCreateSubcategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subcategoryForm.name.trim() || !subcategoryForm.defaultAmount.trim()) {
      toast({
        title: "Missing Information",
        description: "Please provide subcategory name and default amount.",
        variant: "destructive",
      });
      return;
    }
    
    if (editingSubcategory) {
      updateSubcategory.mutate({
        id: editingSubcategory.id,
        ...subcategoryForm,
      });
    } else {
      createSubcategory.mutate(subcategoryForm);
    }
  };

  // Handler functions
  const handleEditCategory = (category: FineCategory) => {
    setEditingCategory(category);
    setCategoryForm({
      name: category.name,
      color: category.color || "#1E40AF",
    });
    setShowAddCategory(true);
  };

  const handleEditSubcategory = (subcategory: FineSubcategory) => {
    setEditingSubcategory(subcategory);
    setSubcategoryForm({
      name: subcategory.name,
      defaultAmount: subcategory.defaultAmount || "",
      icon: subcategory.icon || "fas fa-gavel",
    });
    setShowAddSubcategory(true);
  };

  const handleDeleteCategory = (category: FineCategory) => {
    setDeleteConfirm({
      type: 'category',
      item: category,
    });
  };

  const handleDeleteSubcategory = (subcategory: FineSubcategory) => {
    setDeleteConfirm({
      type: 'subcategory',
      item: subcategory,
    });
  };

  const confirmDelete = () => {
    if (!deleteConfirm) return;
    
    if (deleteConfirm.type === 'category') {
      deleteCategory.mutate(deleteConfirm.item.id);
    } else {
      deleteSubcategory.mutate(deleteConfirm.item.id);
    }
  };

  const formatCurrency = (amount: string) => {
    const num = parseFloat(amount);
    return `£${num.toFixed(2)}`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Tags className="w-5 h-5" />
            <span>Manage Fine Categories</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Categories Section */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Categories</h3>
              <Button 
                onClick={() => setShowAddCategory(!showAddCategory)}
                size="sm"
                className="flex items-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>Add Category</span>
              </Button>
            </div>

            {showAddCategory && (
              <Card className="mb-4">
                <CardContent className="p-4">
                  <form onSubmit={handleCreateCategory} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="md:col-span-2">
                        <Label htmlFor="categoryName">Category Name</Label>
                        <Input
                          id="categoryName"
                          value={categoryForm.name}
                          onChange={(e) => setCategoryForm(prev => ({ ...prev, name: e.target.value }))}
                          placeholder="e.g., Training, Match Day, Social"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="categoryColor">Color</Label>
                        <Input
                          id="categoryColor"
                          type="color"
                          value={categoryForm.color}
                          onChange={(e) => setCategoryForm(prev => ({ ...prev, color: e.target.value }))}
                          className="h-9"
                        />
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Button type="submit" size="sm" disabled={createCategory.isPending || updateCategory.isPending}>
                        {createCategory.isPending || updateCategory.isPending 
                          ? (editingCategory ? 'Updating...' : 'Creating...') 
                          : (editingCategory ? 'Update Category' : 'Create Category')
                        }
                      </Button>
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          setShowAddCategory(false);
                          setEditingCategory(null);
                          setCategoryForm({ name: "", color: "#1E40AF" });
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {categoriesLoading ? (
                <div className="col-span-full text-center py-8">
                  <div className="animate-spin w-6 h-6 border-4 border-primary border-t-transparent rounded-full mx-auto" />
                  <p className="text-sm text-slate-600 mt-2">Loading categories...</p>
                </div>
              ) : categories.length === 0 ? (
                <div className="col-span-full text-center py-8">
                  <Tags className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                  <p className="text-slate-600">No categories yet. Create your first category above.</p>
                </div>
              ) : (
                categories.map((category) => (
                  <Card 
                    key={category.id} 
                    className={`cursor-pointer transition-all hover:shadow-md ${
                      selectedCategoryId === category.id ? 'ring-2 ring-primary' : ''
                    }`}
                    onClick={() => setSelectedCategoryId(category.id)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3 flex-1" onClick={() => setSelectedCategoryId(category.id)}>
                          <div 
                            className="w-4 h-4 rounded-full"
                            style={{ backgroundColor: category.color }}
                          />
                          <div className="flex-1">
                            <h4 className="font-medium text-slate-900">{category.name}</h4>
                            <p className="text-xs text-slate-600">
                              {subcategories.filter(sub => sub.categoryId === category.id).length} subcategories
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Button 
                            size="sm" 
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditCategory(category);
                            }}
                            className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteCategory(category);
                            }}
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>

          {/* Subcategories Section */}
          {selectedCategoryId && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <h3 className="text-lg font-semibold">
                    Subcategories for {categories.find(c => c.id === selectedCategoryId)?.name}
                  </h3>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => {
                      const category = categories.find(c => c.id === selectedCategoryId);
                      if (category) handleDeleteCategory(category);
                    }}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    Delete Category
                  </Button>
                </div>
                <Button 
                  onClick={() => setShowAddSubcategory(!showAddSubcategory)}
                  size="sm"
                  className="flex items-center space-x-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Subcategory</span>
                </Button>
              </div>

              {showAddSubcategory && (
                <Card className="mb-4">
                  <CardContent className="p-4">
                    <form onSubmit={handleCreateSubcategory} className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="subcategoryName">Subcategory Name</Label>
                          <Input
                            id="subcategoryName"
                            value={subcategoryForm.name}
                            onChange={(e) => setSubcategoryForm(prev => ({ ...prev, name: e.target.value }))}
                            placeholder="e.g., Late Arrival, Red Card"
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="defaultAmount">Default Amount (£)</Label>
                          <Input
                            id="defaultAmount"
                            type="number"
                            step="0.01"
                            min="0"
                            value={subcategoryForm.defaultAmount}
                            onChange={(e) => setSubcategoryForm(prev => ({ ...prev, defaultAmount: e.target.value }))}
                            placeholder="5.00"
                            required
                          />
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <Button type="submit" size="sm" disabled={createSubcategory.isPending || updateSubcategory.isPending}>
                          {createSubcategory.isPending || updateSubcategory.isPending 
                            ? (editingSubcategory ? 'Updating...' : 'Creating...') 
                            : (editingSubcategory ? 'Update Subcategory' : 'Create Subcategory')
                          }
                        </Button>
                        <Button 
                          type="button" 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            setShowAddSubcategory(false);
                            setEditingSubcategory(null);
                            setSubcategoryForm({ name: "", defaultAmount: "", icon: "fas fa-gavel" });
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              )}

              <div className="space-y-2">
                {subcategories.length === 0 ? (
                  <div className="text-center py-8">
                    <PoundSterling className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                    <p className="text-slate-600">No subcategories yet. Create your first subcategory above.</p>
                  </div>
                ) : (
                  subcategories.map((subcategory) => (
                    <Card key={subcategory.id}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium text-slate-900">{subcategory.name}</h4>
                            <p className="text-sm text-slate-600">
                              Default: {formatCurrency(subcategory.defaultAmount)}
                            </p>
                          </div>
                          <div className="flex space-x-2">
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleEditSubcategory(subcategory)}
                              className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                            >
                              <Edit2 className="w-4 h-4" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleDeleteSubcategory(subcategory)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {deleteConfirm?.type === 'category' ? 'Category' : 'Subcategory'}</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deleteConfirm?.item?.name}"?
              {deleteConfirm?.type === 'category' && 
                ' This will also delete all subcategories within it.'
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  );
}