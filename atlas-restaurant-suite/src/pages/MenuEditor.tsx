import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Edit2, Trash2, Save, X, GripVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useRestaurant, MenuItem } from '@/context/RestaurantContext';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DndContext,
  DragOverlay,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  useDroppable,
} from '@dnd-kit/core';
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// Draggable Menu Item Component
const DraggableMenuItem: React.FC<{
  item: MenuItem;
  onEdit: (item: MenuItem) => void;
  onDelete: (id: string) => void;
}> = ({ item, onEdit, onDelete }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="bg-card border border-border rounded-lg p-4 flex items-center justify-between hover:border-primary/30 transition-colors cursor-grab active:cursor-grabbing"
    >
      <div className="flex items-center gap-3 flex-1">
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground"
        >
          <GripVertical className="h-5 w-5" />
        </div>
        <div className="flex-1">
          <h3 className="font-medium text-foreground">{item.name}</h3>
          {item.desc && (
            <p className="text-sm text-muted-foreground mt-1">{item.desc}</p>
          )}
          <p className="text-primary font-semibold mt-1">
            {item.price.toFixed(2)} лв
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Button
          size="icon"
          variant="ghost"
          className="h-9 w-9"
          onClick={() => onEdit(item)}
        >
          <Edit2 className="h-4 w-4" />
        </Button>
        <Button
          size="icon"
          variant="ghost"
          className="h-9 w-9 text-destructive hover:text-destructive"
          onClick={() => onDelete(item.id)}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

// Droppable Category Section Component
const CategorySection: React.FC<{
  category: string;
  items: MenuItem[];
  onEdit: (item: MenuItem) => void;
  onDelete: (id: string) => void;
}> = ({ category, items, onEdit, onDelete }) => {
  const { setNodeRef, isOver } = useDroppable({
    id: category,
  });

  return (
    <section
      ref={setNodeRef}
      className={`rounded-lg p-4 transition-colors ${
        isOver ? 'bg-primary/10 border-2 border-primary border-dashed' : 'bg-transparent'
      }`}
    >
      <h2 className="text-xl font-semibold mb-4 text-foreground">
        {category}
        {isOver && <span className="ml-2 text-sm text-primary">(Drop here)</span>}
      </h2>
      <SortableContext items={items.map(i => i.id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-2">
          {items.map(item => (
            <DraggableMenuItem
              key={item.id}
              item={item}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </div>
      </SortableContext>
    </section>
  );
};

// New Category Section Component (for creating categories)
const NewCategorySection: React.FC<{
  categoryName: string;
}> = ({ categoryName }) => {
  const { setNodeRef, isOver } = useDroppable({
    id: categoryName,
  });

  return (
    <section
      ref={setNodeRef}
      className={`rounded-lg p-4 border-2 border-dashed transition-colors ${
        isOver 
          ? 'border-primary bg-primary/10' 
          : 'border-primary/30 bg-primary/5'
      }`}
    >
      <h2 className="text-xl font-semibold mb-4 text-foreground">
        {categoryName}
        <span className="ml-2 text-sm text-muted-foreground">(New category)</span>
        {isOver && <span className="ml-2 text-sm text-primary">(Drop here)</span>}
      </h2>
      <div className="space-y-2 min-h-[60px] flex items-center justify-center text-muted-foreground">
        <p className="text-sm">Drop items here to assign them to this category</p>
      </div>
    </section>
  );
};

const MenuEditor: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { menuItems, addMenuItem, updateMenuItem, deleteMenuItem, loading } = useRestaurant();
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    cat: '',
    price: '',
    desc: '',
  });
  const [draggedItem, setDraggedItem] = useState<MenuItem | null>(null);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [showNewCategoryInput, setShowNewCategoryInput] = useState(false);
  // Optimistic updates for immediate UI feedback
  const [optimisticUpdates, setOptimisticUpdates] = useState<Map<string, Partial<MenuItem>>>(new Map());

  // Sensors for drag and drop
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor)
  );

  // Apply optimistic updates to menuItems for immediate UI feedback
  const displayItems = menuItems.map(item => {
    const optimistic = optimisticUpdates.get(item.id);
    if (optimistic) {
      return { ...item, ...optimistic };
    }
    return item;
  });

  // Group items by category, handling unassigned items
  const groupedItems = displayItems.reduce((acc, item) => {
    // Treat empty, null, or undefined categories as "Unassigned"
    const category = item.cat && item.cat.trim() ? item.cat.trim() : '📦 Unassigned';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(item);
    return acc;
  }, {} as Record<string, MenuItem[]>);

  // Get all unique categories for creating new ones
  const allCategories = Object.keys(groupedItems).filter(cat => cat !== '📦 Unassigned');

  // Clear optimistic updates when menuItems change from real-time subscription
  // This ensures the UI stays in sync with the database
  useEffect(() => {
    // Clear any optimistic updates that match the current database state
    setOptimisticUpdates(prev => {
      const next = new Map(prev);
      let hasChanges = false;
      
      // Remove optimistic updates for items that are now in sync with database
      for (const [itemId, optimistic] of next.entries()) {
        const dbItem = menuItems.find(m => m.id === itemId);
        if (dbItem) {
          // Check if the optimistic update matches the database state
          const isInSync = Object.keys(optimistic).every(key => {
            const dbValue = dbItem[key as keyof MenuItem];
            const optValue = optimistic[key as keyof MenuItem];
            return dbValue === optValue;
          });
          
          if (isInSync) {
            next.delete(itemId);
            hasChanges = true;
          }
        }
      }
      
      return hasChanges ? next : prev;
    });
  }, [menuItems]);

  const handleAddNew = () => {
    setEditingItem(null);
    setFormData({ name: '', cat: '', price: '', desc: '' });
    setIsDialogOpen(true);
  };

  const handleEdit = (item: MenuItem) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      cat: item.cat,
      price: item.price.toString(),
      desc: item.desc || '',
    });
    setIsDialogOpen(true);
  };

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const item = displayItems.find(i => i.id === active.id);
    setDraggedItem(item || null);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setDraggedItem(null);

    if (!over || active.id === over.id) return;

    const item = displayItems.find(i => i.id === active.id);
    const targetCategory = over.id as string;

    if (!item || !targetCategory) return;

    // Normalize category - if dragging to "Unassigned", use empty string
    const normalizedCategory = targetCategory === '📦 Unassigned' ? '' : targetCategory;
    
    // Check if category already exists or if it's the same
    const currentCategory = item.cat && item.cat.trim() ? item.cat.trim() : '📦 Unassigned';
    if (currentCategory === targetCategory) return;

    // Optimistic update: immediately update UI
    setOptimisticUpdates(prev => {
      const next = new Map(prev);
      next.set(item.id, { cat: normalizedCategory });
      return next;
    });

    try {
      await updateMenuItem(item.id, {
        cat: normalizedCategory,
      });
      
      // If dropping on a new category, hide the input after first item is added
      if (showNewCategoryInput && newCategoryName.trim() === targetCategory) {
        setShowNewCategoryInput(false);
        setNewCategoryName('');
      }
      
      // Clear optimistic update immediately after database update
      // Real-time subscription will sync the actual state very quickly
      setOptimisticUpdates(prev => {
        const next = new Map(prev);
        next.delete(item.id);
        return next;
      });
      
      toast({
        title: 'Success',
        description: `Moved "${item.name}" to ${targetCategory}`,
      });
    } catch (error) {
      console.error('Error moving item:', error);
      // Rollback optimistic update on error
      setOptimisticUpdates(prev => {
        const next = new Map(prev);
        next.delete(item.id);
        return next;
      });
      toast({
        title: 'Error',
        description: 'Failed to move item',
        variant: 'destructive',
      });
    }
  };

  const handleCreateCategory = () => {
    if (!newCategoryName.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a category name',
        variant: 'destructive',
      });
      return;
    }

    // Check if category already exists
    if (allCategories.includes(newCategoryName.trim())) {
      toast({
        title: 'Error',
        description: 'Category already exists',
        variant: 'destructive',
      });
      return;
    }

    setShowNewCategoryInput(false);
    setNewCategoryName('');
    toast({
      title: 'Category Created',
      description: `Category "${newCategoryName.trim()}" is ready. Drag items to it to assign them.`,
    });
  };

  const handleSave = async () => {
    if (!formData.name || !formData.price) {
      toast({
        title: 'Error',
        description: 'Please fill in name and price',
        variant: 'destructive',
      });
      return;
    }

    // If no category provided, leave empty (will show in Unassigned)
    const category = formData.cat.trim() || '';

    const price = parseFloat(formData.price);
    if (isNaN(price) || price <= 0) {
      toast({
        title: 'Error',
        description: 'Please enter a valid price',
        variant: 'destructive',
      });
      return;
    }

    try {
      if (editingItem) {
        await updateMenuItem(editingItem.id, {
          name: formData.name,
          cat: category,
          price: price,
          desc: formData.desc || undefined,
        });
        toast({
          title: 'Success',
          description: 'Menu item updated',
        });
      } else {
        await addMenuItem({
          name: formData.name,
          cat: category,
          price: price,
          desc: formData.desc || undefined,
        });
        toast({
          title: 'Success',
          description: 'Menu item added',
        });
      }

      setIsDialogOpen(false);
      setEditingItem(null);
      setFormData({ name: '', cat: '', price: '', desc: '' });
    } catch (error) {
      console.error('Error saving menu item:', error);
      toast({
        title: 'Error',
        description: 'Failed to save menu item',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this menu item?')) {
      try {
        await deleteMenuItem(id);
        toast({
          title: 'Success',
          description: 'Menu item deleted',
        });
      } catch (error) {
        console.error('Error deleting menu item:', error);
        toast({
          title: 'Error',
          description: 'Failed to delete menu item',
          variant: 'destructive',
        });
      }
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background border-b border-border">
        <div className="max-w-6xl mx-auto px-6 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                size="icon"
                variant="ghost"
                className="h-9 w-9 rounded-lg hover:bg-secondary"
                onClick={() => navigate('/admin')}
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div>
                <h1 className="text-2xl font-semibold text-foreground">
                  Menu Editor
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                  Drag items to move between categories
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {showNewCategoryInput ? (
                <div className="flex items-center gap-2">
                  <Input
                    placeholder="New category name..."
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleCreateCategory();
                      } else if (e.key === 'Escape') {
                        setShowNewCategoryInput(false);
                        setNewCategoryName('');
                      }
                    }}
                    className="w-48"
                    autoFocus
                  />
                  <Button size="sm" onClick={handleCreateCategory}>
                    Create
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setShowNewCategoryInput(false);
                      setNewCategoryName('');
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              ) : (
                <Button
                  variant="outline"
                  onClick={() => setShowNewCategoryInput(true)}
                  className="gap-2"
                >
                  <Plus className="h-4 w-4" />
                  New Category
                </Button>
              )}
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={handleAddNew} className="gap-2">
                    <Plus className="h-4 w-4" />
                    Add Item
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>
                      {editingItem ? 'Edit Menu Item' : 'Add Menu Item'}
                    </DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div>
                      <Label htmlFor="name">Name</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="Item name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="cat">Category (optional - drag to move)</Label>
                      <Input
                        id="cat"
                        value={formData.cat}
                        onChange={(e) => setFormData({ ...formData, cat: e.target.value })}
                        placeholder="e.g., 🥣 Супи (or drag item to category)"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        You can drag items to categories after adding them
                      </p>
                    </div>
                    <div>
                      <Label htmlFor="price">Price (лв)</Label>
                      <Input
                        id="price"
                        type="number"
                        step="0.01"
                        value={formData.price}
                        onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                        placeholder="0.00"
                      />
                    </div>
                    <div>
                      <Label htmlFor="desc">Description (optional)</Label>
                      <Input
                        id="desc"
                        value={formData.desc}
                        onChange={(e) => setFormData({ ...formData, desc: e.target.value })}
                        placeholder="Item description"
                      />
                    </div>
                    <div className="flex gap-2 justify-end">
                      <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleSave}>
                        <Save className="h-4 w-4 mr-2" />
                        Save
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>
      </header>

      {/* Menu Items */}
      <main className="max-w-6xl mx-auto px-6 py-8">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading menu items...</p>
            </div>
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <div className="space-y-8">
              {/* Show Unassigned first if it exists */}
              {groupedItems['📦 Unassigned'] && (
                <CategorySection
                  key="📦 Unassigned"
                  category="📦 Unassigned"
                  items={groupedItems['📦 Unassigned']}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              )}
              {/* Show all other categories */}
              {Object.entries(groupedItems)
                .filter(([category]) => category !== '📦 Unassigned')
                .sort(([a], [b]) => a.localeCompare(b))
                .map(([category, items]) => (
                  <CategorySection
                    key={category}
                    category={category}
                    items={items}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                  />
                ))}
              {/* Show empty category placeholder if creating new category - make it droppable */}
              {showNewCategoryInput && newCategoryName.trim() && !allCategories.includes(newCategoryName.trim()) && (
                <NewCategorySection
                  categoryName={newCategoryName.trim()}
                />
              )}
            </div>
            <DragOverlay>
              {draggedItem ? (
                <div className="bg-card border-2 border-primary rounded-lg p-4 shadow-lg opacity-90 min-w-[300px]">
                  <div className="flex-1">
                    <h3 className="font-medium text-foreground">{draggedItem.name}</h3>
                    {draggedItem.desc && (
                      <p className="text-sm text-muted-foreground mt-1">{draggedItem.desc}</p>
                    )}
                    <p className="text-primary font-semibold mt-1">
                      {draggedItem.price.toFixed(2)} лв
                    </p>
                  </div>
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>
        )}
      </main>
    </div>
  );
};

export default MenuEditor;
