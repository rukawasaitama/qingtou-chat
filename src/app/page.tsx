"use client";

import { useState } from "react";
import { characters, getCharacterById } from "@/lib/characters";
import { ChatPanel } from "@/components/chat-panel";
import { CharacterSelector } from "@/components/character-selector";

export default function Home() {
  const [selectedCharId, setSelectedCharId] = useState(characters[0].id);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const selectedCharacter = getCharacterById(selectedCharId) ?? characters[0];

  return (
    <div className="flex flex-col h-screen bg-[#FFF8E7]">
      {/* Header */}
      <header className="flex items-center justify-between px-4 md:px-6 py-3 bg-white/80 backdrop-blur-sm border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#4CAF50] flex items-center justify-center text-white text-lg shadow-sm">
            📖
          </div>
          <div>
            <h1 className="text-base font-bold text-gray-800">课文角色对话</h1>
            <p className="text-xs text-gray-500 hidden sm:block">和课本里的角色做朋友</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div
            className="flex items-center gap-2 px-3 py-1.5 rounded-full text-sm"
            style={{ backgroundColor: selectedCharacter.avatarColor + "15" }}
          >
            <span>{selectedCharacter.emoji}</span>
            <span className="text-gray-700 font-medium hidden sm:inline">
              {selectedCharacter.name}
            </span>
          </div>
        </div>
      </header>

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
        <CharacterSelector
          characters={characters}
          selectedId={selectedCharId}
          onSelect={setSelectedCharId}
          isCollapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        />
        <div className="flex-1 flex flex-col min-w-0">
          <ChatPanel key={selectedCharId} character={selectedCharacter} />
        </div>
      </div>
    </div>
  );
}
