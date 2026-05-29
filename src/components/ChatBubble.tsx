import { useState } from "react";
import ReactMarkdown from "react-markdown";
import { Message } from "../types";
import { Bot, User, Copy, Check } from "lucide-react";
import { motion } from "motion/react";

interface ChatBubbleProps {
  message: Message;
}

export default function ChatBubble({ message }: ChatBubbleProps) {
  const isUser = message.role === "user";
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Copy failed", err);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      id={`message-bubble-wrapper-${message.id}`}
      className={`flex w-full gap-3 ${isUser ? "justify-end" : "justify-start"}`}
    >
      {/* Bot Avatar */}
      {!isUser && (
        <div
          id={`avatar-bot-${message.id}`}
          className="w-8 h-8 rounded-full bg-linear-to-tr from-indigo-500 to-indigo-600 flex items-center justify-center text-white shadow-sm shrink-0 mt-0.5"
        >
          <Bot className="w-4.5 h-4.5" id={`avatar-bot-icon-${message.id}`} />
        </div>
      )}

      {/* Message Body Container */}
      <div
        id={`message-container-${message.id}`}
        className={`flex flex-col max-w-[85%] sm:max-w-[75%] ${isUser ? "items-end" : "items-start"}`}
      >
        {/* Message bubble itself */}
        <div
          id={`bubble-${message.id}`}
          className={`relative group rounded-2xl px-4 py-3 text-sm ${
            isUser
              ? "bg-indigo-600 text-white rounded-tr-none shadow-sm shadow-indigo-600/10"
              : "bg-white border border-slate-100 text-slate-800 rounded-tl-none shadow-xs"
          }`}
        >
          {isUser ? (
            <p className="whitespace-pre-wrap break-words leading-relaxed" id={`plaintext-${message.id}`}>
              {message.content}
            </p>
          ) : (
            <div className="markdown-body prose max-w-none text-slate-800 break-words leading-relaxed space-y-1.5" id={`markdown-${message.id}`}>
              <ReactMarkdown>{message.content}</ReactMarkdown>
            </div>
          )}

          {/* Copy button - only show for AI responses */}
          {!isUser && (
            <button
              onClick={handleCopy}
              id={`copy-btn-${message.id}`}
              className="absolute -bottom-7 right-0 opacity-0 group-hover:opacity-100 focus:opacity-100 flex items-center gap-1 text-[10px] text-slate-400 hover:text-slate-600 transition-opacity bg-slate-50/90 py-0.5 px-1.5 rounded-md border border-slate-100 shadow-2xs cursor-pointer"
              title="답변 복사"
            >
              {copied ? (
                <>
                  <Check className="w-3 h-3 text-green-500" />
                  <span className="text-green-600">복사됨</span>
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" />
                  <span>복사</span>
                </>
              )}
            </button>
          )}
        </div>

        {/* Timestamp */}
        <span 
          id={`time-${message.id}`}
          className="text-[10px] text-slate-400 mt-1 px-1 tracking-tight"
        >
          {message.timestamp}
        </span>
      </div>

      {/* User Avatar */}
      {isUser && (
        <div
          id={`avatar-user-${message.id}`}
          className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 shrink-0 mt-0.5 shadow-2xs"
        >
          <User className="w-4.5 h-4.5" id={`avatar-user-icon-${message.id}`} />
        </div>
      )}
    </motion.div>
  );
}
