import { useState, useEffect, useRef } from "react";
import { Message, Persona, PERSONAS } from "./types";
import PersonaSelector from "./components/PersonaSelector";
import ChatBubble from "./components/ChatBubble";
import { 
  Send, 
  Trash2, 
  Info, 
  Settings, 
  ChevronDown, 
  ChevronUp, 
  Sparkles, 
  Code, 
  Languages, 
  PenTool, 
  ArrowRight,
  Bot,
  HelpCircle
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

// Initial messages definition helper
const getInitialMessages = (persona: Persona): Message[] => [
  {
    id: `welcome-${persona.id}`,
    role: "model",
    content: `안녕하세요! **${persona.name}** 페르소나로 활성화되었습니다.\n\n${persona.description}\n\n어떤 도움이 필요하신가요? 아래 질문 제안 카드를 클릭하거나 자유롭게 질문을 입력해 주세요!`,
    timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
  }
];

export default function App() {
  const [selectedPersona, setSelectedPersona] = useState<Persona>(PERSONAS[0]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [customSystemInstruction, setCustomSystemInstruction] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load chat history from localStorage on mount or persona change
  useEffect(() => {
    const cached = localStorage.getItem(`chat_history_${selectedPersona.id}`);
    if (cached) {
      try {
        setMessages(JSON.parse(cached));
      } catch (e) {
        setMessages(getInitialMessages(selectedPersona));
      }
    } else {
      setMessages(getInitialMessages(selectedPersona));
    }
    // Set default system instruction template
    setCustomSystemInstruction(selectedPersona.systemInstruction);
    setErrorMessage(null);
  }, [selectedPersona]);

  // Save chat history when messages change
  const saveMessages = (updatedMessages: Message[]) => {
    setMessages(updatedMessages);
    localStorage.setItem(`chat_history_${selectedPersona.id}`, JSON.stringify(updatedMessages));
  };

  // Scroll to bottom on updates
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // Handle Send Message
  const handleSendMessage = async (textToSend: string) => {
    const trimmedInput = textToSend.trim();
    if (!trimmedInput || isLoading) return;

    setErrorMessage(null);
    const userMsgId = `msg-${Date.now()}`;
    const userMessage: Message = {
      id: userMsgId,
      role: "user",
      content: trimmedInput,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    const newMessages = [...messages, userMessage];
    saveMessages(newMessages);
    setInputValue("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: newMessages.map(msg => ({
            role: msg.role,
            content: msg.content
          })),
          systemInstruction: customSystemInstruction || selectedPersona.systemInstruction
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "서버 응답 오류가 발생했습니다.");
      }

      const botMessage: Message = {
        id: `msg-${Date.now() + 1}`,
        role: "model",
        content: data.content,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };

      saveMessages([...newMessages, botMessage]);
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || "답변을 전송받는 중 네트워크 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  // Clear Chat History
  const handleClearHistory = () => {
    if (confirm("대화 기록을 모두 비우시겠습니까?")) {
      const reset = getInitialMessages(selectedPersona);
      saveMessages(reset);
      setErrorMessage(null);
    }
  };

  // Render icons for suggestions based on current persona
  const getPersonaSuggestions = (id: string) => {
    switch (id) {
      case "coder":
        return [
          { text: "HTML5 Canvas를 활용한 움직이는 원 그리기 자바스크립트 코드 작성해줘", tag: "코드 생성" },
          { text: "리액트에서 useEffect의 메모리 누수를 방지하기 위한 클린업 함수의 목적이 뭐야?", tag: "이론 분석" },
          { text: "시간 복잡도 O(log N)과 O(N)의 차이를 초보자가 이해하기 쉽게 비유로 설명해줘", tag: "개념 설명" }
        ];
      case "translator":
        return [
          { text: "\"I'm looking forward to working with you\" 문장을 비즈니스 이메일 톤으로 다듬어줘", tag: "비즈니스 영어" },
          { text: "해외 여행 호스텔 체크인 시 방음이 잘 되는 방으로 변경해달라고 할 때 정중하게 쓸 수 있는 회화 알려줘", tag: "여행 회화" },
          { text: "영단어 'empathy', 'sympathy', 'compassion'의 정확한 한국어 맛 차이를 분석해줘", tag: "어휘 비교" }
        ];
      case "writer":
        return [
          { text: "비 내리는 밤, 창가에서 김이 모락모락 나는 에스프레소를 마시는 분위기의 시를 한 편 써줘", tag: "시 저작" },
          { text: "미래 공상과학 SF 소설 아이디어 브레인스토밍: 기억을 사고파는 상점이 등장하는 세계관 구상해줘", tag: "세계관 설계" },
          { text: "유튜브 브이로그 채널 홈 소개란에 들어갈 감각적이고 신뢰감 있는 150자 안내 문안 써줘", tag: "홍보 문안" }
        ];
      default:
        return [
          { text: "현대 기술 발전 트렌드 중 인공지능이 업무 생산성에 미치는 장점과 단점을 한눈에 정리해줘", tag: "생산성 분석" },
          { text: "매일 아침 바쁜 직장인들이 간단하게 챙겨 먹기 좋은 5분 간편 아침 식단 세 가지 조리법을 알려줘", tag: "라이프스타일" },
          { text: "스트레스가 심한 현대인들이 일상에서 가볍게 실천할 수 있는 명상법이나 들숨날숨 이완법 추천해줘", tag: "웰빙 가이드" }
        ];
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans flex flex-col antialiased" id="chatbot-app-root">
      
      {/* Upper Brand Nav / Status Center */}
      <header className="bg-white border-b border-slate-100 py-3.5 px-6 shrink-0 shadow-xs" id="app-header">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4" id="header-container">
          
          {/* Logo Title area */}
          <div className="flex items-center gap-3" id="header-logo-group">
            <div className="w-10 h-10 rounded-xl bg-linear-to-tr from-indigo-500 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-100" id="header-brand-icon">
              <Bot className="w-5.5 h-5.5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2" id="header-title-row">
                <h1 className="text-lg font-bold text-slate-900 tracking-tight" id="header-brand-name">
                  Smart AI Chatbot
                </h1>
                <span className="px-2 py-0.5 rounded-full bg-slate-100 text-[10px] font-semibold text-slate-500 border border-slate-200" id="header-version-badge">
                  v3.5 Flash
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium" id="header-sub-desc">
                Google Gemini API 연동 실시간 대시보드
              </p>
            </div>
          </div>

          {/* Connected state & control indicators */}
          <div className="flex items-center gap-2.5" id="header-control-group">
            <div 
              id="api-connection-status" 
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" id="status-live-ping" />
              <span id="status-live-text">API 서비스 연결 완료</span>
            </div>

            <button
              onClick={handleClearHistory}
              id="clear-chat-btn"
              title="대화 초기화"
              className="p-2 text-slate-400 hover:text-rose-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            >
              <Trash2 className="w-4.5 h-4.5" />
            </button>
          </div>

        </div>
      </header>

      {/* Main Grid View */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 md:px-6 py-6 md:py-8 flex flex-col lg:flex-row gap-6 overflow-hidden" id="main-content-layout">
        
        {/* Left Side: Custom controllers & configurations */}
        <section className="w-full lg:w-80 shrink-0 flex flex-col gap-5" id="left-control-sidebar">
          
          {/* Persona selector list */}
          <PersonaSelector 
            selectedPersona={selectedPersona} 
            onSelectPersona={(persona) => setSelectedPersona(persona)} 
          />

          {/* Quick Informational card */}
          <div className="bg-slate-900 text-white rounded-2xl p-5 border border-slate-800 shadow-md flex flex-col justify-between" id="developer-quick-info">
            <div id="dev-info-body">
              <div className="flex items-center gap-2 text-indigo-400" id="dev-info-title-group">
                <Sparkles className="w-4 h-4 animate-bounce" />
                <span className="text-xs font-bold tracking-wider uppercase">Integration Secret</span>
              </div>
              <h4 className="text-sm font-semibold mt-1" id="dev-info-headline">외부 API 연동 규격</h4>
              <p className="text-slate-400 text-[11px] mt-2 leading-relaxed" id="dev-info-body-text">
                이 플랫폼은 보안을 보장하기 위해 브라우저에서 직접 API를 요청하는 대신, Express 서버 사이드 단망 프록시를 통해 <strong>@google/genai</strong> SDK 클라이언트를 호출합니다.
              </p>
            </div>
            
            <div className="border-t border-slate-800 pt-3 mt-4 flex items-center justify-between text-[11px] text-slate-500 font-mono" id="dev-info-footer">
              <span id="footer-key-label">Secret State:</span>
              <span className="text-indigo-400 font-semibold" id="footer-key-status">Loaded (.env)</span>
            </div>
          </div>

          {/* System prompt override settings controller */}
          <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-2xs" id="custom-prompt-container">
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="flex items-center justify-between w-full font-semibold text-xs text-slate-700 hover:text-indigo-600 transition-colors cursor-pointer"
              id="toggle-settings-btn"
            >
              <span className="flex items-center gap-2" id="settings-btn-text">
                <Settings className="w-4 h-4" />
                고급 시스템 프롬프트 설정 (System Instruction)
              </span>
              {showSettings ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {showSettings && (
              <div className="mt-3.5 space-y-3 pt-3 border-t border-slate-100" id="extended-settings-box">
                <label className="text-[11px] text-slate-400 block font-medium" id="instruction-textarea-label">
                  시스템 제어 프롬프트 (수정 후 답변에 자동 반영됩니다):
                </label>
                <textarea
                  id="system-prompt-textarea"
                  value={customSystemInstruction}
                  onChange={(e) => setCustomSystemInstruction(e.target.value)}
                  placeholder="System Instruction을 직접 작성해 보세요."
                  className="w-full text-xs font-mono p-3 bg-slate-50 rounded-xl border border-slate-200 outline-hidden focus:ring-1 focus:ring-indigo-500 focus:bg-white resize-none"
                  rows={5}
                />
                
                <div className="flex gap-2 justify-end" id="settings-buttons">
                  <button
                    onClick={() => setCustomSystemInstruction(selectedPersona.systemInstruction)}
                    id="reset-instruction-btn"
                    className="px-2.5 py-1.5 rounded-lg text-[10px] font-bold text-slate-500 hover:text-slate-800 hover:bg-slate-100 border border-slate-200 cursor-pointer"
                  >
                    기본값 복원
                  </button>
                  <button
                    onClick={() => {
                      alert("시스템 지침이 임시 저장되었습니다. 다음 대화부터 적용됩니다!");
                      setShowSettings(false);
                    }}
                    id="save-instruction-btn"
                    className="px-2.5 py-1.5 rounded-lg text-[10px] font-bold bg-indigo-600 text-white hover:bg-indigo-700 cursor-pointer"
                  >
                    확인 및 닫기
                  </button>
                </div>
              </div>
            )}
          </div>

        </section>

        {/* Right Side: Conversation Area */}
        <section className="flex-1 bg-white border border-slate-100 rounded-3xl overflow-hidden shadow-xs flex flex-col min-h-[500px]" id="chat-conversation-panel">
          
          {/* Active Status Ribbon */}
          <div className="bg-slate-50/70 border-b border-slate-100 py-3 px-5 flex items-center justify-between" id="active-persona-banner">
            <div className="flex items-center gap-3.5" id="banner-left-meta">
              <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold" id="banner-persona-initial">
                {selectedPersona.id === "coder" && <Code className="w-4.5 h-4.5" />}
                {selectedPersona.id === "translator" && <Languages className="w-4.5 h-4.5" />}
                {selectedPersona.id === "writer" && <PenTool className="w-4.5 h-4.5" />}
                {selectedPersona.id === "helper" && <Sparkles className="w-4.5 h-4.5" />}
              </div>
              <div>
                <h2 className="text-xs font-bold text-slate-900" id="banner-persona-name">
                  {selectedPersona.name}
                </h2>
                <p className="text-[11px] text-slate-500 font-medium truncate max-w-xs sm:max-w-md" id="banner-persona-desc">
                  {selectedPersona.description}
                </p>
              </div>
            </div>
            
            <div className="text-[10px] text-indigo-600 bg-indigo-50/50 px-2.5 py-1 rounded-md font-bold tracking-tight shrink-0 hidden sm:block" id="banner-persona-label">
              Active Session
            </div>
          </div>

          {/* Error Alert Indicator */}
          {errorMessage && (
            <div className="bg-rose-50 border-b border-rose-100 p-4 shrink-0 flex items-start gap-3" id="error-alert-banner">
              <span className="p-1 px-2.5 rounded-full bg-rose-100 text-[10px] font-bold text-rose-700 mt-0.5">ALERT</span>
              <div id="error-message-text-group">
                <span className="text-xs font-bold text-rose-900 block">API 통신 오류가 검출되었습니다:</span>
                <p className="text-rose-700 text-xs mt-1 leading-relaxed">{errorMessage}</p>
              </div>
            </div>
          )}

          {/* Conversation Feed */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6" id="messages-scroll-area">
            {messages.map((message) => (
              <ChatBubble key={message.id} message={message} />
            ))}

            {/* Simulated Live typing status */}
            {isLoading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                id="bot-typing-indicator"
                className="flex items-start gap-3"
              >
                <div className="w-8 h-8 rounded-full bg-linear-to-tr from-indigo-500 to-indigo-600 flex items-center justify-center text-white shrink-0 mt-0.5">
                  <Bot className="w-4.5 h-4.5" />
                </div>
                <div className="bg-slate-50 border border-slate-100 rounded-2xl rounded-tl-none px-4 py-3 shadow-2xs max-w-[150px]">
                  <div className="flex items-center gap-1.5 py-1" id="typing-dots-wrapper">
                    <span className="w-2 h-2 rounded-full bg-indigo-600/30 animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 rounded-full bg-indigo-600/60 animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 rounded-full bg-indigo-600 animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </motion.div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Suggestions Cards (only show if thread is short or we want to prompt) */}
          <div className="px-5 py-3 border-t border-slate-100 bg-slate-50/50" id="suggestions-area">
            <span className="text-[11px] text-slate-400 font-semibold block mb-2" id="suggestions-title">
              아래 제안 질문을 클릭해 대화를 한눈에 시작해 보세요!
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2" id="suggestions-grid">
              {getPersonaSuggestions(selectedPersona.id).map((sug, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(sug.text)}
                  id={`suggestion-btn-${idx}`}
                  disabled={isLoading}
                  className="p-3 text-left bg-white border border-slate-100 hover:border-indigo-200 hover:bg-indigo-50/40 rounded-xl transition-all text-xs text-slate-600 hover:text-indigo-900 group cursor-pointer flex flex-col justify-between h-full gap-2"
                >
                  <span className="text-[10px] font-bold text-slate-400 group-hover:text-indigo-600" id={`sug-badge-${idx}`}>
                    {sug.tag}
                  </span>
                  <span className="font-medium line-clamp-2 leading-relaxed" id={`sug-text-${idx}`}>
                    {sug.text}
                  </span>
                  <span className="mt-1 flex items-center justify-end text-[10px] text-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity self-end" id={`sug-arrow-${idx}`}>
                    전송하기 <ArrowRight className="w-3 h-3 ml-0.5" />
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Bottom Message Composer Input Form */}
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage(inputValue);
            }}
            id="message-composer-form"
            className="border-t border-slate-100 p-4 sm:p-5 flex gap-3 bg-white"
          >
            <input
              type="text"
              id="chat-text-input"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              disabled={isLoading}
              placeholder={`${selectedPersona.name}에게 질문할 내용을 입력해 주세요...`}
              className="flex-1 bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3 text-sm focus:outline-hidden focus:bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 disabled:opacity-50"
              autoComplete="off"
            />
            <button
              type="submit"
              id="message-send-btn"
              disabled={isLoading || !inputValue.trim()}
              className="bg-indigo-600 text-white rounded-2xl px-5 py-3 hover:bg-indigo-700 active:bg-indigo-800 disabled:bg-slate-100 disabled:text-slate-400 font-semibold text-sm transition-all duration-200 shadow-sm shadow-indigo-100 shrink-0 flex items-center justify-center gap-2 cursor-pointer"
            >
              <span className="hidden sm:inline" id="send-btn-title">보내기</span>
              <Send className="w-4 h-4" id="send-btn-icon" />
            </button>
          </form>

        </section>

      </main>

      {/* Footer Branding credits */}
      <footer className="py-4 text-center text-xs text-slate-400 border-t border-slate-100 shrink-0 bg-white" id="page-footer">
        <div className="max-w-7xl mx-auto px-4" id="footer-container-inner">
          © 2026 AI Chatbot Dashboard. Powered by the Google Gemini API & Express Node SDK.
        </div>
      </footer>

    </div>
  );
}
