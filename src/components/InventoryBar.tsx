import React, { useState } from 'react';
import { Briefcase, Info, X } from 'lucide-react';
import { InventoryItem, ItemId } from '../types';
import { sound } from '../services/soundEngine';

interface InventoryBarProps {
  items: InventoryItem[];
  selectedItem: ItemId | null;
  onSelectItem: (itemId: ItemId | null) => void;
}

export const InventoryBar: React.FC<InventoryBarProps> = ({
  items,
  selectedItem,
  onSelectItem,
}) => {
  const [inspectingItem, setInspectingItem] = useState<InventoryItem | null>(null);

  const handleItemClick = (item: InventoryItem) => {
    sound.playUiClick();
    if (selectedItem === item.id) {
      onSelectItem(null);
    } else {
      onSelectItem(item.id);
    }
  };

  const handleInspect = (e: React.MouseEvent, item: InventoryItem) => {
    e.stopPropagation();
    sound.playUiClick();
    setInspectingItem(item);
  };

  return (
    <>
      {/* Bottom Inventory Bar */}
      <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-30 pointer-events-auto select-none">
        <div className="flex items-center gap-2 p-2 bg-slate-900/90 backdrop-blur-md rounded-2xl border border-slate-700/80 shadow-2xl">
          <div className="flex items-center gap-1.5 px-2.5 py-1 text-slate-400 font-bold text-xs">
            <Briefcase className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Pouch</span>
            <span className="text-[11px] bg-slate-800 px-1.5 py-0.5 rounded-md text-amber-300 font-mono">
              {items.length}
            </span>
          </div>

          <div className="h-6 w-px bg-slate-700" />

          {/* Item Slots */}
          <div className="flex items-center gap-2">
            {items.length === 0 ? (
              <div className="px-4 py-1.5 text-xs text-slate-500 italic">
                Inventory empty — explore the room!
              </div>
            ) : (
              items.map((item) => {
                const isSelected = selectedItem === item.id;
                return (
                  <div
                    key={item.id}
                    onClick={() => handleItemClick(item)}
                    className={`group relative flex items-center gap-1.5 px-3 py-1.5 rounded-xl border cursor-pointer transition-all active:scale-95 ${
                      isSelected
                        ? 'bg-amber-400/20 border-amber-400 text-amber-300 shadow-md shadow-amber-400/10 scale-105'
                        : 'bg-slate-800/80 border-slate-700 text-slate-200 hover:bg-slate-700 hover:border-slate-500'
                    }`}
                  >
                    <span className="text-base">{item.icon}</span>
                    <span className="text-xs font-bold whitespace-nowrap">{item.name}</span>

                    <button
                      onClick={(e) => handleInspect(e, item)}
                      className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-slate-600 rounded-md text-slate-400 hover:text-white transition-opacity"
                      title="Inspect Item"
                    >
                      <Info className="w-3 h-3" />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Item Detail Inspector Modal */}
      {inspectingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-xs bg-slate-900 border border-slate-700 rounded-3xl p-5 shadow-2xl text-center space-y-3">
            <button
              onClick={() => setInspectingItem(null)}
              className="absolute top-4 right-4 p-1.5 bg-slate-800 hover:bg-slate-700 rounded-xl text-slate-300 hover:text-white transition-all"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="w-16 h-16 mx-auto rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center text-3xl shadow-inner">
              {inspectingItem.icon}
            </div>

            <div className="space-y-1">
              <h3 className="text-sm font-extrabold text-white">{inspectingItem.name}</h3>
              <p className="text-xs text-slate-300 leading-relaxed">{inspectingItem.description}</p>
            </div>

            <button
              onClick={() => {
                sound.playUiClick();
                onSelectItem(inspectingItem.id);
                setInspectingItem(null);
              }}
              className="w-full py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs rounded-xl transition-all shadow"
            >
              Select / Equip Item
            </button>
          </div>
        </div>
      )}
    </>
  );
};
