"use client";

import type { Character } from "@/lib/characters";

interface CharacterSelectorProps {
  characters: Character[];
  selectedId: string;
  onSelect: (id: string) => void;
  isCollapsed: boolean;
  onToggle: () => void;
}

export function CharacterSelector({
  characters,
  selectedId,
  onSelect,
  isCollapsed,
  onToggle,
}: CharacterSelectorProps) {
  return (
    <>
      {/* Mobile: horizontal tabs */}
      <div className="md:hidden border-b border-gray-100 bg-white/80 backdrop-blur-sm">
        <div className="flex overflow-x-auto px-3 py-2 gap-2">
          {characters.map((char) => (
            <button
              key={char.id}
              onClick={() => onSelect(char.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm whitespace-nowrap transition-all ${
                selectedId === char.id
                  ? "bg-[#4CAF50] text-white shadow-sm"
                  : "bg-gray-50 text-gray-600 hover:bg-gray-100"
              }`}
            >
              <span className="text-lg">{char.emoji}</span>
              <span>{char.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Desktop: sidebar */}
      <div
        className={`hidden md:flex flex-col border-r border-gray-100 bg-white/60 backdrop-blur-sm transition-all duration-300 ${
          isCollapsed ? "w-16" : "w-64"
        }`}
      >
        {/* Toggle button */}
        <button
          onClick={onToggle}
          className="p-3 text-gray-400 hover:text-gray-600 transition-colors self-end"
          title={isCollapsed ? "展开" : "收起"}
        >
          <svg
            className={`w-5 h-5 transition-transform ${isCollapsed ? "rotate-180" : ""}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        {/* Character list */}
        <div className="flex-1 overflow-y-auto px-2 pb-4 space-y-1">
          {characters.map((char) => (
            <button
              key={char.id}
              onClick={() => onSelect(char.id)}
              className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left transition-all ${
                selectedId === char.id
                  ? "bg-[#4CAF50]/10 border border-[#4CAF50]/30"
                  : "hover:bg-gray-50 border border-transparent"
              }`}
            >
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-xl shrink-0"
                style={{ backgroundColor: char.avatarColor + "20" }}
              >
                {char.emoji}
              </div>
              {!isCollapsed && (
                <div className="min-w-0">
                  <div className="text-sm font-medium text-gray-800 truncate">
                    {char.name}
                  </div>
                  <div className="text-xs text-gray-500 truncate">
                    {char.source}
                  </div>
                </div>
              )}
            </button>
          ))}
        </div>

        {/* Info */}
        {!isCollapsed && (
          <div className="p-3 border-t border-gray-100">
            <p className="text-xs text-gray-400 text-center">
              选择课文角色开始对话
            </p>
          </div>
        )}
      </div>
    </>
  );
}
