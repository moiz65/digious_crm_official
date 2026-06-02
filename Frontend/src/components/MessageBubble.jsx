// src/components/Chat/MessageBubble.jsx
import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useChat } from "../context/ChatContext";
import {
  Check,
  CheckCheck,
  Download,
  Trash2,
  MoreVertical,
} from "lucide-react";
import axios from 'axios';

const MessageBubble = ({ message }) => {
  const { user } = useAuth();
  const { deleteMessage } = useChat();
  const [showMenu, setShowMenu] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const currentUserId = user?.id || user?.employeeId;
  const isOwn = message.from_user === currentUserId;

  const formatTime = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const handleDelete = async () => {
    if (window.confirm("Delete this message?")) {
      await deleteMessage(message.id);
    }
  };

  const handleDownload = async () => {
    const token = localStorage.getItem("token");
    const messageId = message.id;

    setIsDownloading(true);

    try {
      const response = await axios({
        url: `${process.env.REACT_APP_API_URL}/api/v1/chat/download/${messageId}`,
        method: "GET",
        responseType: "blob",
        headers: { Authorization: `Bearer ${token}` },
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", message.file_name || "download");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Download error:", error);
      
      let errorMessage = "Failed to download file";
      if (error.response?.status === 401) {
        errorMessage = "Authentication failed. Please login again.";
      } else if (error.response?.status === 404) {
        errorMessage = "File not found on server.";
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      }
      
      alert(errorMessage);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div
      className={`flex ${isOwn ? "justify-end" : "justify-start"} group relative mb-3`}
    >
      <div
        className={`relative max-w-[70%] ${isOwn ? "items-end" : "items-start"}`}
      >
        <div
          className={`rounded-2xl px-4 py-2 ${
            isOwn
              ? "bg-indigo-500 text-white rounded-br-none"
              : "bg-white text-gray-900 rounded-bl-none shadow-sm border border-gray-100"
          }`}
        >
          {message.type === "file" ? (
            <div className="flex items-center gap-3">
              <div
                className={`p-2 rounded-lg ${isOwn ? "bg-indigo-400" : "bg-gray-100"}`}
              >
                📎
              </div>
              <div>
                <p
                  className={`text-sm font-medium ${isOwn ? "text-white" : "text-gray-700"}`}
                >
                  {message.file_name || "File"}
                </p>
                <p
                  className={`text-xs ${isOwn ? "text-indigo-200" : "text-gray-400"}`}
                >
                  {(message.file_size / 1024).toFixed(2)} KB
                </p>
              </div>
              <button
                onClick={handleDownload}
                disabled={isDownloading}
                className={`p-1.5 rounded-full transition-colors ${
                  isOwn ? "hover:bg-indigo-400" : "hover:bg-gray-100"
                } ${isDownloading ? "opacity-50 cursor-wait" : ""}`}
              >
                <Download
                  className={`w-4 h-4 ${isOwn ? "text-white" : "text-gray-500"}`}
                />
              </button>
            </div>
          ) : (
            <p className="text-sm break-words whitespace-pre-wrap">
              {message.message}
            </p>
          )}

          <div
            className={`flex items-center justify-end gap-1 mt-1 ${
              isOwn ? "text-indigo-200" : "text-gray-400"
            }`}
          >
            <span className="text-[10px]">
              {formatTime(message.created_at)}
            </span>
            {isOwn &&
              (message.is_read ? (
                <CheckCheck className="w-3 h-3" />
              ) : (
                <Check className="w-3 h-3" />
              ))}
          </div>
        </div>

        {isOwn && (
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="absolute -left-8 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-gray-100 rounded-full"
          >
            <MoreVertical className="w-4 h-4 text-gray-400" />
          </button>
        )}

        {showMenu && (
          <div className="absolute -left-24 top-1/2 transform -translate-y-1/2 bg-white shadow-lg rounded-lg py-1 z-10">
            <button
              onClick={handleDelete}
              className="flex items-center gap-2 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 w-full"
            >
              <Trash2 className="w-4 h-4" />
              Delete
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default MessageBubble;
