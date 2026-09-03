"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import type { Character } from "@/lib/characters";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  isStreaming?: boolean;
}

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export function ChatPanel({ character }: { character: Character }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isRecognizing, setIsRecognizing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  useEffect(() => {
    setMessages([
      {
        id: "greeting",
        role: "assistant",
        content: character.greeting,
      },
    ]);
  }, [character]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput("");

    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: userMessage,
    };

    const assistantMsgId = (Date.now() + 1).toString();
    const assistantMsg: Message = {
      id: assistantMsgId,
      role: "assistant",
      content: "",
      isStreaming: true,
    };

    setMessages((prev) => [...prev, userMsg, assistantMsg]);
    setIsLoading(true);

    const chatHistory: ChatMessage[] = [
      ...messages
        .filter((m) => m.id !== "greeting")
        .map((m) => ({ role: m.role, content: m.content })),
      { role: "user" as const, content: userMessage },
    ];

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: chatHistory,
          characterId: character.id,
        }),
        signal: abortController.signal,
      });

      if (!response.ok) {
        throw new Error("请求失败");
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error("无法读取响应流");

      const decoder = new TextDecoder();
      let accumulated = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const text = decoder.decode(value, { stream: true });
        const lines = text.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6);
            if (data === "[DONE]") break;
            try {
              const parsed = JSON.parse(data);
              if (parsed.content) {
                accumulated += parsed.content;
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantMsgId
                      ? { ...m, content: accumulated }
                      : m
                  )
                );
              }
            } catch {
              // skip invalid JSON
            }
          }
        }
      }

      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantMsgId ? { ...m, isStreaming: false } : m
        )
      );
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") return;
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantMsgId
            ? { ...m, content: "哎呀，出了点小问题，请再试一次吧！", isStreaming: false }
            : m
        )
      );
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Voice recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];

      const recorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
          ? "audio/webm;codecs=opus"
          : "audio/webm",
      });

      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      recorder.onstop = async () => {
        // Stop all tracks
        stream.getTracks().forEach((track) => track.stop());

        const audioBlob = new Blob(audioChunksRef.current, { type: recorder.mimeType });
        if (audioBlob.size < 1000) return; // too short

        setIsRecognizing(true);

        try {
          // Convert blob to base64
          const reader = new FileReader();
          reader.readAsDataURL(audioBlob);
          reader.onload = async () => {
            const base64Audio = reader.result as string;
            const base64Data = base64Audio.split(",")[1]; // Remove data URL prefix

            const response = await fetch("/api/asr", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ audio: base64Data }),
            });

            if (response.ok) {
              const data = await response.json();
              if (data.text) {
                setInput(data.text);
              }
            }
          };
        } catch (err) {
          console.error("ASR error:", err);
        } finally {
          setIsRecognizing(false);
        }
      };

      recorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Mic error:", err);
      alert("无法访问麦克风，请检查权限设置");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const toggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div className={`flex items-end gap-2 max-w-[80%] ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
              {/* Avatar */}
              {msg.role === "assistant" && (
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center text-lg shrink-0 overflow-hidden shadow-sm"
                  style={{ backgroundColor: character.avatarColor + "20" }}
                >
                  {character.avatarUrl ? (
                    <img src={character.avatarUrl} alt={character.name} className="w-full h-full object-cover" />
                  ) : (
                    character.emoji
                  )}
                </div>
              )}
              {/* Bubble */}
              <div
                className={`px-4 py-3 text-[15px] leading-relaxed ${
                  msg.role === "user"
                    ? "bg-[#E3F2FD] text-gray-800 rounded-[20px] rounded-br-[6px]"
                    : "bg-[#E8F5E9] text-gray-800 rounded-[20px] rounded-bl-[6px]"
                }`}
              >
                {msg.content ? (
                  <>
                    {msg.content}
                    {msg.isStreaming && (
                      <span className="inline-block w-0.5 h-4 bg-gray-500 animate-pulse ml-0.5 align-middle" />
                    )}
                  </>
                ) : msg.isStreaming ? (
                  <span className="inline-flex gap-1">
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                  </span>
                ) : null}
              </div>
              {/* User avatar */}
              {msg.role === "user" && (
                <div className="w-9 h-9 rounded-full bg-[#E3F2FD] flex items-center justify-center text-lg shrink-0 shadow-sm">
                  🧒
                </div>
              )}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-gray-100 px-4 py-3 bg-white/80 backdrop-blur-sm">
        <div className="flex items-center gap-3 max-w-3xl mx-auto">
          {/* Voice input button */}
          <button
            onClick={toggleRecording}
            disabled={isRecognizing}
            className={`shrink-0 w-11 h-11 rounded-full flex items-center justify-center transition-all ${
              isRecording
                ? "bg-red-100 text-red-500 animate-pulse shadow-sm"
                : "bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-700"
            } disabled:opacity-50`}
            title={isRecording ? "点击停止录音" : "点击开始语音输入"}
          >
            {isRecognizing ? (
              <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m-4 0h8" />
              </svg>
            )}
          </button>

          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              isRecognizing
                ? "正在听你说话..."
                : `和${character.name}说点什么吧...`
            }
            disabled={isLoading || isRecognizing}
            className="flex-1 px-4 py-3 bg-gray-50 rounded-2xl text-[15px] outline-none border border-gray-200 focus:border-[#4CAF50] focus:ring-2 focus:ring-[#4CAF50]/20 transition-all disabled:opacity-50"
          />
          <button
            onClick={sendMessage}
            disabled={isLoading || !input.trim()}
            className="px-5 py-3 bg-[#4CAF50] text-white rounded-2xl text-[15px] font-medium hover:bg-[#43A047] active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
          >
            发送
          </button>
        </div>
        {isRecording && (
          <div className="flex items-center justify-center gap-2 mt-2">
            <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            <span className="text-xs text-red-500">正在录音，点击麦克风按钮停止</span>
          </div>
        )}
      </div>
    </div>
  );
}