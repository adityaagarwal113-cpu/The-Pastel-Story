import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Trash2, Edit3, Image as ImageIcon, Save, X } from 'lucide-react';
import { MenuItem, Category } from '../types';
import { CATEGORIES } from '../constants';
import { compressImage } from '../lib/image';

interface MenuManagementProps {
  menu: MenuItem[];
  categories: string[];
  onAdd: (item: MenuItem) => void;
  onRemove: (id: string) => void;
  onUpdate: (item: MenuItem) => void;
  onAddCategory: (category: string) => void;
  onRemoveCategory: (category: string) => void;
}

export default function MenuManagement({ menu, categories, onAdd, onRemove, onUpdate, onAddCategory, onRemoveCategory }: MenuManagementProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [isManagingCategories, setIsManagingCategories] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newCatName, setNewCatName] = useState('');
  const [newItem, setNewItem] = useState<Partial<MenuItem>>({
    category: categories[0] || 'Coffee',
    price: 0,
    name: '',
    description: '',
    image: 'https://images.unsplash.com/photo-1572442388796-11668a67e53d?q=80&w=800&auto=format&fit=crop'
  });

  const handleFileUpload = async (file: File): Promise<string> => {
    try {
      return await compressImage(file, 500, 0.7);
    } catch (err) {
      console.warn("Compression fallback inside MenuManagement handleFileUpload:", err);
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => resolve(event.target?.result as string);
        reader.onerror = (error) => reject(error);
      });
    }
  };

  const handleEdit = (item: MenuItem) => {
    setNewItem(item);
    setEditingId(item.id);
    setIsAdding(true);
  };

  const handleSave = () => {
    if (newItem.name && newItem.price && newItem.category) {
      if (editingId) {
        onUpdate({
          ...newItem,
          id: editingId,
          allowExtraCheese: newItem.allowExtraCheese || false
        } as MenuItem);
      } else {
        onAdd({
          ...newItem,
          id: Date.now().toString(),
          rating: 4.8,
          reviews: 0,
          allowExtraCheese: newItem.allowExtraCheese || false
        } as MenuItem);
      }
      setIsAdding(false);
      setEditingId(null);
      setNewItem({ 
        category: categories[0] || 'Coffee', 
        price: 0, 
        name: '', 
        description: '',
        image: 'https://images.unsplash.com/photo-1572442388796-11668a67e53d?q=80&w=800&auto=format&fit=crop',
        allowExtraCheese: false
      });
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-bold">Menu Inventory</h3>
        <div className="flex gap-3">
          <button 
            onClick={() => setIsManagingCategories(true)}
            className="flex items-center gap-2 px-6 py-3 bg-white border border-[#E5E5E5] text-[#1A1A1A] rounded-2xl font-bold hover:bg-[#F2F1EF] transition-all"
          >
            Manage Categories
          </button>
          <button 
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-2 px-6 py-3 bg-[#1A1A1A] text-white rounded-2xl font-bold hover:bg-[#D97706] transition-all shadow-lg"
          >
            <Plus size={20} /> Add New Item
          </button>
        </div>
      </div>

      {/* Category Modal */}
      <AnimatePresence>
        {isManagingCategories && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[110] flex items-center justify-center p-6"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white rounded-[2.5rem] w-full max-w-md p-8 shadow-2xl space-y-8"
            >
              <div className="flex justify-between items-center">
                <h4 className="text-xl font-black italic uppercase tracking-tight">Manage Categories</h4>
                <button onClick={() => setIsManagingCategories(false)} className="w-10 h-10 bg-[#F8F7F4] rounded-full flex items-center justify-center text-[#8B7E74]">
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-4">
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    value={newCatName}
                    onChange={(e) => setNewCatName(e.target.value)}
                    placeholder="New category name..."
                    className="flex-1 bg-[#F8F7F4] p-4 rounded-xl outline-none focus:ring-2 focus:ring-[#D97706] text-sm"
                  />
                  <button 
                    onClick={() => { if(newCatName) { onAddCategory(newCatName); setNewCatName(''); } }}
                    className="bg-[#1A1A1A] text-white p-4 rounded-xl hover:bg-[#D97706] transition-colors"
                  >
                    <Plus size={20} />
                  </button>
                </div>

                <div className="max-h-64 overflow-y-auto space-y-2 pr-2">
                  {categories.map(cat => (
                    <div key={cat} className="flex justify-between items-center p-4 bg-[#F8F7F4] rounded-xl border border-[#F2F1EF]">
                      <span className="font-bold text-sm uppercase tracking-widest">{cat}</span>
                      <button 
                        onClick={() => onRemoveCategory(cat)}
                        className="text-red-400 hover:text-red-600 transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence>
          {isAdding && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white rounded-3xl p-6 border-2 border-dashed border-[#D97706] space-y-6"
            >
              <h4 className="font-bold flex items-center gap-2 text-[#D97706]">
                <Plus size={18} /> {editingId ? 'Edit Menu Item' : 'New Menu Item'}
              </h4>
              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-[#8B7E74]">Name</label>
                  <input 
                    type="text" 
                    value={newItem.name}
                    onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                    className="w-full bg-[#F8F7F4] p-3 rounded-xl outline-none focus:ring-2 focus:ring-[#D97706] text-sm"
                    placeholder="e.g. Vanilla Latte"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-[#8B7E74]">Price (₹)</label>
                    <input 
                      type="number" 
                      value={newItem.price || ''}
                      onChange={(e) => setNewItem({ ...newItem, price: Number(e.target.value) })}
                      className="w-full bg-[#F8F7F4] p-3 rounded-xl outline-none focus:ring-2 focus:ring-[#D97706] text-sm"
                      placeholder="Price"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-[#8B7E74]">Category</label>
                    <select 
                      value={newItem.category}
                      onChange={(e) => setNewItem({ ...newItem, category: e.target.value as Category })}
                      className="w-full bg-[#F8F7F4] p-3 rounded-xl outline-none focus:ring-2 focus:ring-[#D97706] text-sm appearance-none"
                    >
                      {categories.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                </div>
                <div className="flex items-center justify-between p-4 bg-[#F8F7F4] rounded-xl border border-[#F2F1EF]">
                   <div className="space-y-0.5">
                      <p className="text-[10px] font-black uppercase tracking-widest text-[#1A1A1A]">Extra Cheese Support</p>
                      <p className="text-[8px] font-bold text-[#8B7E74] uppercase">Allow users to add cheese for +₹30</p>
                   </div>
                   <div 
                    onClick={() => setNewItem({ ...newItem, allowExtraCheese: !newItem.allowExtraCheese })}
                    className={`w-12 h-6 rounded-full transition-all cursor-pointer relative ${newItem.allowExtraCheese ? 'bg-[#D97706]' : 'bg-[#E5E5E5]'}`}
                   >
                     <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${newItem.allowExtraCheese ? 'left-7' : 'left-1'}`} />
                   </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-[#8B7E74]">Product Photo</label>
                  <div 
                    className="relative group cursor-pointer"
                    onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('ring-2', 'ring-[#D97706]'); }}
                    onDragLeave={(e) => { e.preventDefault(); e.currentTarget.classList.remove('ring-2', 'ring-[#D97706]'); }}
                    onDrop={(e) => {
                      e.preventDefault();
                      e.currentTarget.classList.remove('ring-2', 'ring-[#D97706]');
                      const file = e.dataTransfer.files[0];
                      if (file && file.type.startsWith('image/')) {
                        handleFileUpload(file)
                          .then((compressedUrl) => {
                            setNewItem({ ...newItem, image: compressedUrl });
                          })
                          .catch((err) => console.error("Drop image compression failed:", err));
                      }
                    }}
                    onClick={() => document.getElementById('file-upload')?.click()}
                  >
                    <input 
                      id="file-upload"
                      type="file" 
                      className="hidden" 
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          handleFileUpload(file)
                            .then((compressedUrl) => {
                              setNewItem({ ...newItem, image: compressedUrl });
                            })
                            .catch((err) => console.error("File selection compression failed:", err));
                        }
                      }}
                    />
                    <div className="aspect-video bg-[#F8F7F4] rounded-2xl border-2 border-dashed border-[#E5E5E5] overflow-hidden flex flex-col items-center justify-center gap-2 group-hover:border-[#D97706] transition-all">
                      {newItem.image ? (
                        <div className="relative w-full h-full animate-fadeIn">
                           <img src={newItem.image} alt="Preview" className="w-full h-full object-cover" />
                           <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                              <span className="text-white text-[10px] font-black uppercase tracking-widest">Change Photo</span>
                           </div>
                        </div>
                      ) : (
                        <>
                          <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm text-[#8B7E74]">
                             <Plus size={20} />
                          </div>
                          <p className="text-[8px] font-black uppercase tracking-widest text-[#8B7E74]">Drag photo here or click</p>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => setIsAdding(false)}
                  className="flex-1 py-3 bg-[#F2F1EF] text-[#8B7E74] rounded-xl font-bold flex items-center justify-center gap-2"
                >
                  <X size={16} /> Cancel
                </button>
                <button 
                  onClick={handleSave}
                  className="flex-1 py-3 bg-[#1A1A1A] text-white rounded-xl font-bold flex items-center justify-center gap-2"
                >
                  <Save size={16} /> Save Item
                </button>
              </div>
            </motion.div>
          )}

          {menu.map((item) => (
            <motion.div
              layout
              key={item.id}
              className="bg-white rounded-3xl p-4 shadow-sm border border-[#E5E5E5] flex gap-4"
            >
              <div className="w-24 h-24 rounded-2xl overflow-hidden shrink-0">
                <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 min-w-0 flex flex-col">
                <div className="flex justify-between items-start">
                  <span className="text-[8px] font-bold uppercase tracking-widest text-[#D97706] mb-1">{item.category}</span>
                  <div className="flex gap-1">
                    <button 
                      onClick={() => handleEdit(item)}
                      className="p-1 px-2 text-[#8B7E74] hover:bg-[#F2F1EF] rounded-lg border border-transparent hover:border-[#E5E5E5] transition-all"
                    >
                      <Edit3 size={14} />
                    </button>
                    <button 
                      onClick={() => onRemove(item.id)}
                      className="p-1 px-2 text-red-400 hover:bg-red-50 rounded-lg border border-transparent hover:border-red-100 transition-all"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
                <h4 className="font-bold text-sm truncate">{item.name}</h4>
                <div className="flex items-center gap-2 mt-1">
                  <p className="text-xs font-bold text-[#1A1A1A]">₹{item.price}</p>
                  {item.allowExtraCheese && (
                    <span className="text-[7px] font-black uppercase tracking-widest bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded-sm">Cheese Opt.</span>
                  )}
                </div>
                <div className="mt-auto flex items-center gap-2 text-[10px] text-[#8B7E74]">
                   Rating: {item.rating} • {item.reviews} reviews
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
