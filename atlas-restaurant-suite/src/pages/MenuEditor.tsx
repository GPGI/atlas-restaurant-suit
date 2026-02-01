import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Edit2, Trash2, Save, X } from 'lucide-react';
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

  // Group items by category
  const groupedItems = menuItems.reduce((acc, item) => {
    if (!acc[item.cat]) {
      acc[item.cat] = [];
    }
    acc[item.cat].push(item);
    return acc;
  }, {} as Record<string, MenuItem[]>);

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

  const handleSave = async () => {
    if (!formData.name || !formData.cat || !formData.price) {
      toast({
        title: 'Error',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

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
          cat: formData.cat,
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
          cat: formData.cat,
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
                  Manage your menu items
                </p>
              </div>
            </div>
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
                    <Label htmlFor="cat">Category</Label>
                    <Input
                      id="cat"
                      value={formData.cat}
                      onChange={(e) => setFormData({ ...formData, cat: e.target.value })}
                      placeholder="e.g., 🥣 Супи"
                    />
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
          <div className="space-y-8">
            {Object.entries(groupedItems).map(([category, items]) => (
            <section key={category}>
              <h2 className="text-xl font-semibold mb-4 text-foreground">
                {category}
              </h2>
              <div className="space-y-2">
                {items.map(item => (
                  <div
                    key={item.id}
                    className="bg-card border border-border rounded-lg p-4 flex items-center justify-between hover:border-primary/30 transition-colors"
                  >
                    <div className="flex-1">
                      <h3 className="font-medium text-foreground">{item.name}</h3>
                      {item.desc && (
                        <p className="text-sm text-muted-foreground mt-1">{item.desc}</p>
                      )}
                      <p className="text-primary font-semibold mt-1">
                        {item.price.toFixed(2)} лв
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-9 w-9"
                        onClick={() => handleEdit(item)}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-9 w-9 text-destructive hover:text-destructive"
                        onClick={() => handleDelete(item.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default MenuEditor;
