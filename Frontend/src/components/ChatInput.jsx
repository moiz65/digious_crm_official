// src/components/Chat/ChatInput.jsx
import React, { useState, useRef } from "react";
import { useChat } from "../context/ChatContext";
import { Send, Paperclip, X, Image, File } from "lucide-react";

const ChatInput = ({ onTyping }) => {
  const { currentChat, sendMessage, sendFile } = useChat();
  const [message, setMessage] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const fileInputRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const handleTyping = (e) => {
    setMessage(e.target.value);

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

    if (onTyping) {
      onTyping(true);
    }

    typingTimeoutRef.current = setTimeout(() => {
      if (onTyping) {
        onTyping(false);
      }
    }, 2000);
  };

  const handleSend = async () => {
    if (!message.trim() && !selectedFile) return;

    if (selectedFile) {
      setIsUploading(true);
      try {
        await sendFile(currentChat.other_user.id, selectedFile);
        setSelectedFile(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
      } catch (error) {
        console.error("File upload error:", error);
        alert("Failed to upload file");
      } finally {
        setIsUploading(false);
      }
    }

    if (message.trim()) {
      await sendMessage(currentChat.other_user.id, message);
      setMessage("");
      if (onTyping) {
        onTyping(false);
      }
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      // ✅ Only check size, not file type
      const maxSize = 100 * 1024 * 1024; // 100 MB
      if (file.size > maxSize) {
        alert(
          `File size exceeds 100 MB limit. Your file is ${(file.size / (1024 * 1024)).toFixed(2)} MB`,
        );
        return;
      }
      setSelectedFile(file);
    }
  };

  const clearSelectedFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="border-t border-gray-200 bg-white p-3">
      {selectedFile && (
        <div className="mb-2 p-2 bg-gray-50 rounded-lg flex items-center justify-between">
          <div className="flex items-center gap-2">
            {selectedFile.type.startsWith("image/") ? (
              <Image className="w-4 h-4 text-blue-500" />
            ) : (
              <File className="w-4 h-4 text-gray-500" />
            )}
            <span className="text-sm text-gray-600 truncate max-w-[200px]">
              {selectedFile.name}
            </span>
            <span className="text-xs text-gray-400">
              ({(selectedFile.size / 1024).toFixed(1)} KB)
            </span>
          </div>
          <button
            onClick={clearSelectedFile}
            className="p-1 hover:bg-gray-200 rounded-full transition-colors"
          >
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>
      )}

      {isUploading && (
        <div className="mb-2">
          <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-indigo-500 animate-pulse w-full" />
          </div>
          <p className="text-xs text-gray-500 mt-1">Uploading...</p>
        </div>
      )}

      <div className="flex items-end gap-2">
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="p-2 text-gray-400 hover:text-indigo-500 hover:bg-gray-50 rounded-full transition-colors disabled:opacity-50"
        >
          <Paperclip className="w-5 h-5" />
        </button>

        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          className="hidden"
          accept="*/*" // ✅ Allow all file types
        />

        <textarea
          value={message}
          onChange={handleTyping}
          onKeyPress={handleKeyPress}
          placeholder="Type a message..."
          className="flex-1 resize-none border border-gray-200 focus:border-indigo-300 focus:ring-1 focus:ring-indigo-300 rounded-xl py-2 px-3 max-h-28 min-h-[40px] bg-gray-50 text-gray-700 placeholder-gray-400 text-sm outline-none transition-colors"
          rows={1}
        />

        <button
          onClick={handleSend}
          disabled={(!message.trim() && !selectedFile) || isUploading}
          className="p-2 bg-indigo-500 hover:bg-indigo-600 rounded-full text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
        >
          <Send className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default ChatInput;
