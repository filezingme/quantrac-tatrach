import React, { useState, useEffect } from 'react';
import { SpecGroup, SpecItem } from '../types';
import { ChevronDown, Plus, Trash2, Save, FolderPlus, Check } from 'lucide-react';
import { db } from '../utils/db';
import { useUI } from '../components/GlobalUI';

export const TechnicalSpecsView: React.FC = () => {
  // Load initial state from LocalStorage via db util
  const [specs, setSpecs] = useState<SpecGroup[]>(() => db.specs.get());
  const [hasChanges, setHasChanges] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const ui = useUI();
  
  // Manage expanded state for groups
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  // Reset save status after 3 seconds
  useEffect(() => {
    if (saveStatus === 'saved') {
      const timer = setTimeout(() => setSaveStatus('idle'), 3000);
      return () => clearTimeout(timer);
    }
  }, [saveStatus]);

  const toggle = (id: string) => setExpanded(prev => ({ ...prev, [id]: !prev[id] }));

  const handleSave = () => {
    setSaveStatus('saving');
    // Simulate a small delay for better UX feel or just save immediately
    setTimeout(() => {
      db.specs.set(specs);
      setHasChanges(false);
      setSaveStatus('saved');
    }, 500);
  };

  // Helper to deep update the spec tree
  const updateSpecs = (fn: (groups: SpecGroup[]) => SpecGroup[]) => {
    setSpecs(prev => fn(prev));
    setHasChanges(true);
    setSaveStatus('idle');
  };

  const addItem = (parentId: string) => {
    // We don't use prompt here for better UX, we add a placeholder item
    const newItem: SpecItem = { 
      id: Date.now().toString(), 
      name: 'Thông số mới', 
      value: '-', 
      unit: '' 
    };
    
    updateSpecs(list => list.map(g => {
       // If adding to a main group
       if (g.id === parentId) {
         return { ...g, items: [...g.items, newItem] };
       }
       // If adding to a subgroup (check subGroups)
       if (g.subGroups) {
         return {
           ...g,
           subGroups: g.subGroups.map(sg => 
             sg.id === parentId ? { ...sg, items: [...sg.items, newItem] } : sg
           )
         };
       }
       return g;
    }));
    
    // Auto expand the group if needed
    setExpanded(prev => ({ ...prev, [parentId]: true }));
  };

  const addSubGroup = (parentId: string) => {
    ui.prompt({
      title: 'Thêm hạng mục con',
      message: 'Nhập tên công trình hoặc hạng mục con (VD: Đập phụ số 1):',
      placeholder: 'Tên hạng mục...',
      onConfirm: (title) => {
        if (!title.trim()) return;
        const newGroup: SpecGroup = { id: `sg-${Date.now()}`, title, items: [] };

        updateSpecs(list => list.map(g => {
          if (g.id === parentId) return { ...g, subGroups: [...(g.subGroups || []), newGroup] };
          return g;
        }));
        setExpanded(prev => ({ ...prev, [parentId]: true }));
      }
    });
  };

  const updateItem = (itemId: string, field: keyof SpecItem, val: string) => {
    // Recursive function to find and update item in a list
    const updateInList = (items: SpecItem[]): SpecItem[] => 
      items.map(i => i.id === itemId ? { ...i, [field]: val } : i);

    updateSpecs(list => list.map(g => ({
      ...g,
      items: updateInList(g.items),
      subGroups: g.subGroups ? g.subGroups.map(sg => ({ ...sg, items: updateInList(sg.items) })) : undefined
    })));
  };

  const deleteItem = (itemId: string) => {
    ui.confirm({
        message: 'Bạn có chắc chắn muốn xóa thông số này?',
        type: 'danger',
        onConfirm: () => {
            const removeFromList = (items: SpecItem[]): SpecItem[] => items.filter(i => i.id !== itemId);
            
            updateSpecs(list => list.map(g => ({
            ...g,
            items: removeFromList(g.items),
            subGroups: g.subGroups ? g.subGroups.map(sg => ({ ...sg, items: removeFromList(sg.items) })) : undefined
            })));
        }
    });
  };

  const renderItems = (items: SpecItem[]) => (
    <div className="overflow-x-auto">
      <table className="w-full text-sm text-left border-t border-slate-100 dark:border-slate-700">
        <thead className="bg-slate-50 dark:bg-slate-700/50 text-xs text-slate-400 dark:text-slate-500 uppercase">
          <tr>
            <th className="px-4 py-2 font-medium w-1/3">Tên thông số</th>
            <th className="px-4 py-2 font-medium">Giá trị</th>
            <th className="px-4 py-2 font-medium w-24">Đơn vị</th>
            <th className="px-4 py-2 w-10"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50 dark:divide-slate-700/50">
          {items.map(item => (
            <tr key={item.id} className="hover:bg-blue-50/50 dark:hover:bg-slate-700/30 group transition-colors">
              <td className="px-4 py-2">
                <input 
                  value={item.name} 
                  onChange={e => updateItem(item.id, 'name', e.target.value)} 
                  className="bg-transparent w-full outline-none font-medium text-slate-700 dark:text-slate-300 placeholder-slate-300 focus:text-blue-700 dark:focus:text-blue-400"
                  placeholder="Tên thông số..."
                />
              </td>
              <td className="px-4 py-2">
                <input 
                  value={item.value} 
                  onChange={e => updateItem(item.id, 'value', e.target.value)} 
                  className="bg-transparent w-full outline-none text-slate-900 dark:text-white font-semibold focus:text-blue-700 dark:focus:text-blue-400"
                  placeholder="Giá trị..."
                />
              </td>
              <td className="px-4 py-2">
                 <input 
                   value={item.unit} 
                   onChange={e => updateItem(item.id, 'unit', e.target.value)} 
                   className="bg-transparent w-full outline-none text-slate-500 dark:text-slate-400 text-xs focus:text-blue-600 dark:focus:text-blue-400"
                   placeholder="Đơn vị"
                 />
              </td>
              <td className="px-4 py-2 text-center">
                <button 
                  onClick={() => deleteItem(item.id)} 
                  className="p-1 text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded opacity-0 group-hover:opacity-100 transition-all"
                  title="Xóa dòng này"
                >
                  <Trash2 size={14}/>
                </button>
              </td>
            </tr>
          ))}
          {items.length === 0 && (
            <tr>
              <td colSpan={4} className="px-4 py-3 text-center text-xs text-slate-400 italic">
                Chưa có thông số nào
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="space-y-6 pb-20 max-w-5xl mx-auto animate-fade-in">
      {/* Header - No longer sticky */}
      <div className="bg-slate-50/95 dark:bg-slate-900/95 py-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Thông số kỹ thuật</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">Quản lý các thông số thiết kế và hiện trạng công trình</p>
        </div>
        
        <div className="flex items-center gap-3">
          {hasChanges && (
            <span className="text-xs text-amber-600 dark:text-amber-400 font-medium bg-amber-50 dark:bg-amber-900/30 px-2 py-1 rounded animate-pulse">
              ● Có thay đổi chưa lưu
            </span>
          )}
          <button 
            onClick={handleSave} 
            disabled={saveStatus === 'saving' || !hasChanges}
            className={`
              flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold shadow-md transition-all
              ${saveStatus === 'saved' 
                ? 'bg-green-600 text-white shadow-green-200 dark:shadow-none' 
                : hasChanges 
                  ? 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-lg shadow-blue-200 dark:shadow-blue-900/50 cursor-pointer' 
                  : 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed shadow-none'}
            `}
          >
            {saveStatus === 'saving' ? (
              <>Đang lưu...</>
            ) : saveStatus === 'saved' ? (
              <><Check size={18}/> Đã lưu</>
            ) : (
              <><Save size={18}/> Lưu thay đổi</>
            )}
          </button>
        </div>
      </div>

      <div className="space-y-6">
        {specs.map(group => (
          <div key={group.id} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden shadow-sm transition-shadow hover:shadow-md">
             {/* Main Group Header */}
             <div 
               className="px-6 py-5 bg-slate-50 dark:bg-slate-800/50 flex justify-between items-center cursor-pointer select-none hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors group/header" 
               onClick={() => toggle(group.id)}
             >
               <div className="flex items-center gap-4">
                 <h3 className="font-bold text-slate-800 dark:text-slate-200 text-lg">
                   {group.title}
                 </h3>
                 <span className="text-xs font-medium text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-700 px-2.5 py-1 rounded-full border border-slate-200 dark:border-slate-600 shadow-sm">
                   {group.items.length + (group.subGroups?.reduce((acc, sg) => acc + sg.items.length, 0) || 0)} thông số
                 </span>
               </div>

               <div className={`p-1.5 rounded-full transition-all duration-200 ${expanded[group.id] ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rotate-180' : 'text-slate-400 group-hover/header:bg-white dark:group-hover/header:bg-slate-700 group-hover/header:shadow-sm'}`}>
                  <ChevronDown size={20} />
               </div>
             </div>

             {/* Expanded Content */}
             {expanded[group.id] && (
               <div className="p-0 animate-in slide-in-from-top-2 duration-200">
                 {/* Items directly in group */}
                 {renderItems(group.items)}
                 
                 <div className="px-4 py-3 bg-slate-50/30 dark:bg-slate-700/30 border-t border-slate-100 dark:border-slate-700">
                    <button 
                      onClick={() => addItem(group.id)} 
                      className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors w-fit"
                    >
                      <Plus size={14}/> Thêm thông số mới
                    </button>
                 </div>

                 {/* Subgroups (e.g. Aux Dams) */}
                 {group.subGroups && (
                   <div className="bg-slate-50/50 dark:bg-slate-900/50 border-t border-slate-200 dark:border-slate-700 p-4 space-y-4">
                     {group.subGroups.map(sg => (
                       <div key={sg.id} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden shadow-sm">
                          <div className="px-4 py-2 bg-slate-100 dark:bg-slate-700 border-b border-slate-200 dark:border-slate-600 flex justify-between items-center">
                             <h4 className="font-semibold text-slate-700 dark:text-slate-300 text-sm flex items-center gap-2">
                               <div className="w-1.5 h-1.5 rounded-full bg-slate-400"></div>
                               {sg.title}
                             </h4>
                             <button className="text-xs text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 p-1 rounded" title="Xóa nhóm này">
                               <Trash2 size={12}/>
                             </button>
                          </div>
                          {renderItems(sg.items)}
                          <div className="px-4 py-2 border-t border-slate-100 dark:border-slate-700">
                            <button 
                              onClick={() => addItem(sg.id)} 
                              className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                            >
                              <Plus size={12}/> Thêm dòng
                            </button>
                          </div>
                       </div>
                     ))}
                     
                     <button 
                       onClick={() => addSubGroup(group.id)} 
                       className="w-full py-3 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg text-slate-500 dark:text-slate-400 text-sm font-medium hover:border-blue-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-all flex items-center justify-center gap-2"
                     >
                       <FolderPlus size={16}/> Thêm hạng mục con
                     </button>
                   </div>
                 )}
               </div>
             )}
          </div>
        ))}
      </div>
      
      {/* Bottom Padding for scroll */}
      <div className="h-10"></div>
    </div>
  );
};