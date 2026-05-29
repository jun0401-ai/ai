import { useState, useEffect, useRef } from "react";
import { Message, Persona, PERSONAS } from "./types";
import PersonaSelector from "./components/PersonaSelector";
import ChatBubble from "./components/ChatBubble";
import { 
  Send, 
  Trash2, 
  Settings, 
  ChevronDown, 
  ChevronUp, 
  Sparkles, 
  ArrowRight, 
  Bot, 
  HeartHandshake, 
  Zap, 
  BookOpen, 
  Music, 
  Play, 
  Disc, 
  ExternalLink,
  Volume2,
  CloudSun,
  SmilePlus
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface SongItem {
  id: string;
  title: string;
  artist: string;
  reason: string;
}

// Bulletproof parser to extract the recommended music playlist from the model's response
const parsePlaylist = (content: string): SongItem[] => {
  const startIndex = content.indexOf("[RECOMMENDED_PLAYLIST]");
  const endIndex = content.indexOf("[PLAYLIST_END]");
  if (startIndex === -1) return [];

  const playlistText = endIndex !== -1 
    ? content.substring(startIndex + "[RECOMMENDED_PLAYLIST]".length, endIndex)
    : content.substring(startIndex + "[RECOMMENDED_PLAYLIST]".length);

  const lines = playlistText.split("\n");
  const parsedSongs: SongItem[] = [];

  lines.forEach((line, index) => {
    let cleanLine = line.trim();
    if (!cleanLine) return;

    // Remove numbers "1. ", "10. ", "1)", or bullet points "- "
    cleanLine = cleanLine.replace(/^\d+[\s\.\)-]+\s*/, "");
    cleanLine = cleanLine.replace(/^-\s*/, "");
    if (!cleanLine) return;

    // Detect the " - " separator
    const separatorIdx = cleanLine.indexOf(" - ");
    if (separatorIdx !== -1) {
      const title = cleanLine.substring(0, separatorIdx).trim();
      const remaining = cleanLine.substring(separatorIdx + 3).trim();

      let artist = remaining;
      let reason = "오늘 당신의 감정 무드에 완벽하게 어울리는 음악 테라피 트랙";

      // Look for a reason inside parentheses (reason)
      const parenIdx = remaining.indexOf("(");
      const closeParenIdx = remaining.lastIndexOf(")");
      
      if (parenIdx !== -1 && closeParenIdx !== -1 && closeParenIdx > parenIdx) {
        artist = remaining.substring(0, parenIdx).trim();
        reason = remaining.substring(parenIdx + 1, closeParenIdx).trim();
      } else {
        const colonIdx = remaining.indexOf(":");
        if (colonIdx !== -1) {
          artist = remaining.substring(0, colonIdx).trim();
          reason = remaining.substring(colonIdx + 1).trim();
        }
      }

      parsedSongs.push({
        id: `song-${index}-${Date.now()}`,
        title: title.replace(/^["'『「«]+|["'』」»]+$/g, ""), 
        artist: artist.replace(/^["'『「«]+|["'』」»]+$/g, ""),
        reason: reason
      });
    }
  });

  return parsedSongs;
};

// Welcome greeting template depending on curator persona selected
const getInitialMessages = (persona: Persona): Message[] => [
  {
    id: `welcome-${persona.id}`,
    role: "model",
    content: `안녕하세요! **${persona.name}**가 당신의 소중한 감정의 목소리를 듣기 위해 찾아왔습니다.\n\n오늘 어떤 일이 있으셨나요? 무슨 생각이나 기분인지, 몸은 지치지 않았는지 마음속 이야기를 편하게 건네주세요.\n\n사연 가득한 속마음을 듣고, 가슴을 채워줄 따뜻한 **10개의 맞춤 음악 플레이리스트**를 큐레이팅해 드리겠습니다.`,
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

  // Auto scroll logic
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // Load chat history from localStorage on persona shift or mount
  useEffect(() => {
    const cached = localStorage.getItem(`music_chat_history_${selectedPersona.id}`);
    if (cached) {
      try {
        setMessages(JSON.parse(cached));
      } catch (e) {
        setMessages(getInitialMessages(selectedPersona));
      }
    } else {
      setMessages(getInitialMessages(selectedPersona));
    }
    setCustomSystemInstruction(selectedPersona.systemInstruction);
    setErrorMessage(null);
  }, [selectedPersona]);

  // Handler to persist changes
  const saveMessages = (updatedMessages: Message[]) => {
    setMessages(updatedMessages);
    localStorage.setItem(`music_chat_history_${selectedPersona.id}`, JSON.stringify(updatedMessages));
  };

  // Extract playlist tracks reactively from the state! We find the latest recommendation.
  const lastModelWithPlaylist = [...messages]
    .reverse()
    .find(m => m.role === "model" && m.content.includes("[RECOMMENDED_PLAYLIST]"));

  const detectedPlaylist = lastModelWithPlaylist 
    ? parsePlaylist(lastModelWithPlaylist.content)
    : [];

  // API Call handler
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
        throw new Error(data.error || "서버 혹은 API 응답 중 오류가 발생했습니다.");
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

  // Clear Chat history handler
  const handleClearHistory = () => {
    if (confirm("대화 및 추천 플레이리스트를 비우고 다시 시작하시겠습니까?")) {
      const reset = getInitialMessages(selectedPersona);
      saveMessages(reset);
      setErrorMessage(null);
    }
  };

  // Targeted suggestions based on the music therapy persona
  const getPersonaSuggestions = (id: string) => {
    switch (id) {
      case "booster":
        return [
          { text: "오늘 유독 의욕이 없고 몸이 너무 무거워... 달콤하게 잠든 몸의 구동 스위치를 켜줄 신나는 리듬 음악 추천해줘!", tag: "의욕 공급" },
          { text: "날씨도 화창한데 신나는 마음을 200% 증폭시켜 줄 최신 K-Pop 댄스랑 신나는 하우스 뮤직 10곡 부탁해!", tag: "기분 업" },
          { text: "주말에 야외 운동이나 드라이브를 하려고 하는데 심장을 신나게 두드릴 파워풀한 곡 리스트 짜줘.", tag: "러닝/드라이브" }
        ];
      case "focus":
        return [
          { text: "지금 컴퓨터 앞에서 중요한 코딩과 기획 구상을 해야 해. 가사가 없고 평온하게 뇌파를 돕는 로파이(Lofi)와 클래식 10곡 추천해줘.", tag: "깊은 몰입" },
          { text: "하루 종일 너무 바쁘게 뛰어다녀서 뇌가 터질 것 같이 과부하 걸렸어. 숲속을 걸으며 마음을 이완시킬 잔잔한 명상곡 들려줘.", tag: "이완/스트레스" },
          { text: "머리가 복잡하고 걱정이 많아서 오늘 밤 쉽게 잠들 수 있을지 걱정이야. 포근하게 침대 속에서 듣기 좋은 슬립 피아노 곡들 준비해줘.", tag: "숙면 가이드" }
        ];
      case "retro":
        return [
          { text: "저녁 가로등 불빛 아래에서 따뜻한 밀크티 한잔 타서 아날로그 감성에 빠지고 싶어. 감아두었던 8090 명반 10곡 들려주고 낭만을 추천해줘.", tag: "아날로그 필터" },
          { text: "비 내리는 밤에 불을 다 꺼두고 노랗게 반짝이는 스탠드 하나 켜두었어... 보물 같은 레트로 시티팝과 인디 밴드 명곡 추천해줘.", tag: "도심/야간" },
          { text: "비디오테이프나 LP 턴테이블이 생각나는 그리운 복고풍 올드팝이나 포크송 10곡을 그 시절 낭만적인 스토리와 함께 들려줘.", tag: "레트로 팝" }
        ];
      default: // healing
        return [
          { text: "회사(또는 하루 일상)에서 사람 관계 때문에 마음의 상처를 받고 돌아왔어... 마음을 포근하게 품어줄 부드러운 위로 음악 10곡 부탁해.", tag: "관계의 위로" },
          { text: "가진 능력에 비해 나만 항상 정체되고 뒤처지는 기분이 들어서 울적해. 지친 내 자존감을 자장가처럼 다독여줄 다정한 노래 추천 장착해줘.", tag: "자존감 허그" },
          { text: "특별히 나쁜 일은 없었는데 이상하게 공허하고 쓸쓸함이 가득 차올랐어. 내 쓸쓸한 감정을 조용히 똑똑 편지해줄 인디 어쿠스틱 노래 원해.", tag: "공허한 위안" }
        ];
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans flex flex-col antialiased" id="chatbot-app-root">
      
      {/* Header section with theme colors */}
      <header className="bg-white border-b border-slate-100 py-3.5 px-6 shrink-0 shadow-2xs" id="app-header">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4" id="header-container">
          
          {/* Logo Title area */}
          <div className="flex items-center gap-3.5" id="header-logo-group">
            <div className="w-10 h-10 rounded-xl bg-linear-to-tr from-indigo-600 to-indigo-700 flex items-center justify-center text-white shadow-md shadow-indigo-100 shrink-0" id="header-brand-icon">
              <Bot className="w-5.5 h-5.5" />
            </div>
            <div>
              <div className="flex items-center gap-2" id="header-title-row">
                <span className="font-mono text-[9px] font-bold text-indigo-600 bg-indigo-50 border border-indigo-200 px-1.5 py-0.5 rounded-sm tracking-wide">
                  AI MUSIC THERAPY
                </span>
                <h1 className="text-base font-bold text-slate-900 tracking-tight" id="header-brand-name">
                  MeloTherapy AI (마음 날씨 AI 음악 비서)
                </h1>
              </div>
              <p className="text-xs text-slate-500 font-medium" id="header-sub-desc">
                당신의 사연과 감정을 스스로 진단하고, 10곡의 전속 치료 음악 플레이리스트를 선사합니다.
              </p>
            </div>
          </div>

          {/* Connected state & control indicators */}
          <div className="flex items-center gap-2.5" id="header-control-group">
            <div 
              id="api-connection-status" 
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-[11px] font-bold shadow-2xs"
            >
              <SmilePlus className="w-3.5 h-3.5 text-indigo-500 animate-pulse" />
              <span id="status-live-text">감정 큐레이터 대기 중</span>
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

      {/* Main Grid Content View */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 md:px-6 py-6 md:py-8 flex flex-col lg:flex-row gap-6 overflow-hidden" id="main-content-layout">
        
        {/* Left Sidebar: Controls and Realtime Playlist display */}
        <section className="w-full lg:w-80 shrink-0 flex flex-col gap-5" id="left-control-sidebar">
          
          {/* Persona selector list */}
          <PersonaSelector 
            selectedPersona={selectedPersona} 
            onSelectPersona={(persona) => setSelectedPersona(persona)} 
          />

          {/* Real-time Custom Dynamic Music List Widget */}
          <div className="bg-slate-900 text-slate-100 rounded-3xl border border-slate-800 shadow-md p-5 flex flex-col gap-4 overflow-hidden" id="realtime-music-box">
            
            {/* Widget header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 block" id="music-widget-title-sec">
              <div className="flex items-center gap-2" id="music-widget-lbl">
                <Disc className={`w-5 h-5 text-indigo-400 ${detectedPlaylist.length > 0 ? "animate-spin" : ""}`} style={{ animationDuration: '6s' }} />
                <span className="text-xs font-bold tracking-wider text-slate-200">오늘의 마음 처방 송리스트</span>
              </div>
              <span className="text-[10px] bg-indigo-500/20 text-indigo-300 font-bold px-2 py-0.5 rounded-full" id="music-count-val">
                {detectedPlaylist.length} Track
              </span>
            </div>

            {/* List container */}
            <div className="flex-1 min-h-[220px] max-h-[380px] overflow-y-auto pr-1 space-y-2 text-xs" id="music-items-scroller">
              <AnimatePresence mode="popLayout">
                {detectedPlaylist.length > 0 ? (
                  detectedPlaylist.map((song, i) => (
                    <motion.div
                      key={song.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 10 }}
                      transition={{ delay: i * 0.04 }}
                      id={`list-song-${song.id}`}
                      className="group bg-slate-800/40 hover:bg-slate-800 border border-slate-800/60 hover:border-slate-700/80 p-2.5 rounded-xl transition-all duration-200 flex items-start justify-between gap-2.5"
                    >
                      <div className="min-w-0" id={`info-song-col-${song.id}`}>
                        <div className="flex items-center gap-1.5" id={`title-row-${song.id}`}>
                          <span className="text-[10px] font-mono text-indigo-400 font-bold shrink-0">{i + 1}</span>
                          <span className="font-bold text-slate-100 truncate block text-[11px]" title={song.title}>
                            {song.title}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-400 block mt-0.5 truncate font-medium">
                          {song.artist}
                        </span>
                        <p className="text-[10px] text-slate-500 block mt-1 line-clamp-1 italic font-medium leading-normal">
                          {song.reason}
                        </p>
                      </div>

                      <a
                        href={`https://www.youtube.com/results?search_query=${encodeURIComponent(song.title + " " + song.artist)}`}
                        target="_blank"
                        rel="noreferrer referrer"
                        id={`play-link-${song.id}`}
                        title="유튜브에서 곡 검색"
                        className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white hover:bg-indigo-600 transition-colors shrink-0 self-center flex items-center justify-center cursor-pointer"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                      </a>
                    </motion.div>
                  ))
                ) : (
                  <div className="h-[220px] flex flex-col items-center justify-center text-center p-4 text-slate-500 space-y-3" id="empty-music-wrapper">
                    <CloudSun className="w-10 h-10 text-slate-700" />
                    <div>
                      <span className="font-bold text-slate-400 text-[11px] block text-center">처방 리스트가 비어 있습니다</span>
                      <p className="text-[11px] text-slate-600 mt-1 lines-clamp-4 leading-relaxed text-center">
                        큐레이터에게 당신의 속마음, 혹은 오늘 있었던 크고 작은 일화들을 일기처럼 들려주세요. 감정을 진단하여 10곡의 플레이리스트를 즉석 생성합니다.
                      </p>
                    </div>
                  </div>
                )}
              </AnimatePresence>
            </div>

            {/* Instruction footnote */}
            {detectedPlaylist.length > 0 && (
              <p className="text-[10px] text-slate-500 leading-normal text-center border-t border-slate-800/80 pt-2.5" id="youtube-search-notif">
                🎵 재생 아이콘을 클릭하면 유튜브 라이브 음원으로 바로 연결되어 감상할 수 있습니다.
              </p>
            )}
          </div>

          {/* System prompt override settings controller */}
          <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-2xs" id="custom-prompt-container">
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="flex items-center justify-between w-full font-bold text-[11px] text-slate-700 hover:text-indigo-600 transition-colors cursor-pointer"
              id="toggle-settings-btn"
            >
              <span className="flex items-center gap-2" id="settings-btn-text">
                <Settings className="w-4 h-4 text-slate-400" />
                지침 커스텀 (System Instruction)
              </span>
              {showSettings ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
            </button>

            {showSettings && (
              <div className="mt-3 py-3 border-t border-slate-100 space-y-3" id="extended-settings-box">
                <label className="text-[10px] text-slate-400 block font-medium" id="instruction-textarea-label">
                  이 페르소나가 따를 지침을 조정할 수 있습니다:
                </label>
                <textarea
                  id="system-prompt-textarea"
                  value={customSystemInstruction}
                  onChange={(e) => setCustomSystemInstruction(e.target.value)}
                  placeholder="System Instruction을 직접 작성해 보세요."
                  className="w-full text-[11px] font-mono p-2.5 bg-slate-50 rounded-xl border border-slate-150 outline-hidden focus:ring-1 focus:ring-indigo-500 focus:bg-white resize-none leading-relaxed"
                  rows={5}
                />
                
                <div className="flex gap-2 justify-end" id="settings-buttons">
                  <button
                    onClick={() => setCustomSystemInstruction(selectedPersona.systemInstruction)}
                    id="reset-instruction-btn"
                    className="px-2 py-1 rounded-md text-[10px] font-bold text-slate-500 hover:text-slate-800 hover:bg-slate-100 border border-slate-200 cursor-pointer"
                  >
                    기본 복원
                  </button>
                  <button
                    onClick={() => {
                      alert("완료되었습니다! 대화 도중 실시간 프롬프트가 즉각 반영됩니다.");
                      setShowSettings(false);
                    }}
                    id="save-instruction-btn"
                    className="px-2.5 py-1 rounded-md text-[10px] font-bold bg-indigo-600 text-white hover:bg-indigo-700 cursor-pointer"
                  >
                    적용하기
                  </button>
                </div>
              </div>
            )}
          </div>

        </section>

        {/* Right Side: Conversation Area Panel */}
        <section className="flex-1 bg-white border border-slate-100 rounded-3xl overflow-hidden shadow-xs flex flex-col min-h-[500px]" id="chat-conversation-panel">
          
          {/* Active Status Ribbon */}
          <div className="bg-slate-50/70 border-b border-slate-100 py-3.5 px-5 flex items-center justify-between" id="active-persona-banner">
            <div className="flex items-center gap-3" id="banner-left-meta">
              <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold shadow-2xs" id="banner-persona-initial">
                {selectedPersona.id === "healing" && <HeartHandshake className="w-4.5 h-4.5" />}
                {selectedPersona.id === "booster" && <Zap className="w-4.5 h-4.5" />}
                {selectedPersona.id === "focus" && <BookOpen className="w-4.5 h-4.5" />}
                {selectedPersona.id === "retro" && <Music className="w-4.5 h-4.5" />}
              </div>
              <div>
                <h2 className="text-xs font-bold text-slate-900" id="banner-persona-name">
                  현재 상담 큐레이팅: {selectedPersona.name}
                </h2>
                <p className="text-[10px] text-slate-500 font-medium truncate max-w-xs sm:max-w-md mt-0.5" id="banner-persona-desc">
                  {selectedPersona.description}
                </p>
              </div>
            </div>
            
            <div className="text-[10px] text-indigo-600 bg-indigo-100/50 px-2.5 py-1 rounded-md font-bold shrink-0 hidden sm:block animate-pulse" id="banner-persona-label">
              Active Music session
            </div>
          </div>

          {/* Error Alert Indicator */}
          {errorMessage && (
            <div className="bg-rose-50 border-b border-rose-100 p-4 shrink-0 flex items-start gap-3 animate-bounce" id="error-alert-banner">
              <span className="p-1 px-2.5 rounded-full bg-rose-100 text-[9px] font-bold text-rose-700 mt-0.5">ALERT</span>
              <div id="error-message-text-group">
                <span className="text-xs font-bold text-rose-900 block">통합 서비스 연결 오류 검출:</span>
                <p className="text-rose-700 text-xs mt-1 leading-relaxed">{errorMessage}</p>
              </div>
            </div>
          )}

          {/* Conversation Feed */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 bg-slate-50/20" id="messages-scroll-area">
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
                  <Bot className="w-4.5 h-4.5 animate-spin" />
                </div>
                <div className="bg-white border border-slate-150 rounded-2xl rounded-tl-none px-4 py-3 shadow-2xs max-w-[200px]">
                  <p className="text-[10px] font-bold text-indigo-600 animate-pulse mb-1">인공지능 마음 주파수 진단 중</p>
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
              💡 당신의 감정에 노킹해 주세요 (아래의 감정 예시 시나리오들을 선택해 보세요):
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5" id="suggestions-grid">
              {getPersonaSuggestions(selectedPersona.id).map((sug, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(sug.text)}
                  id={`suggestion-btn-${idx}`}
                  disabled={isLoading}
                  className="p-3 text-left bg-white border border-slate-100 hover:border-indigo-200 hover:bg-indigo-50/20 rounded-xl transition-all text-xs text-slate-600 hover:text-indigo-900 group cursor-pointer flex flex-col justify-between h-full gap-2"
                >
                  <span className="text-[9px] font-bold text-slate-400 group-hover:text-indigo-600" id={`sug-badge-${idx}`}>
                    {sug.tag}
                  </span>
                  <span className="font-semibold line-clamp-3 leading-relaxed text-slate-700 group-hover:text-slate-900" id={`sug-text-${idx}`}>
                    {sug.text}
                  </span>
                  <span className="mt-1 flex items-center justify-end text-[10px] text-indigo-550 opacity-0 group-hover:opacity-100 transition-opacity self-end" id={`sug-arrow-${idx}`}>
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
              placeholder={`오늘 어떤 마음 편지지나 일기를 써보고 싶으신가요? 편하게 입력을 해주세요...`}
              className="flex-1 bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3 text-sm focus:outline-hidden focus:bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 disabled:opacity-50 font-medium"
              autoComplete="off"
            />
            <button
              type="submit"
              id="message-send-btn"
              disabled={isLoading || !inputValue.trim()}
              className="bg-indigo-600 text-white rounded-2xl px-5 py-3 hover:bg-indigo-700 active:bg-indigo-800 disabled:bg-slate-100 disabled:text-slate-400 font-semibold text-sm transition-all duration-200 shadow-sm shadow-indigo-100 shrink-0 flex items-center justify-center gap-2 cursor-pointer"
            >
              <span className="hidden sm:inline" id="send-btn-title">마음 보내기</span>
              <Send className="w-4 h-4" id="send-btn-icon" />
            </button>
          </form>

        </section>

      </main>

      {/* Footer Branding credits */}
      <footer className="py-4 text-center text-xs text-slate-400 border-t border-slate-100 shrink-0 bg-white" id="page-footer">
        <div className="max-w-7xl mx-auto px-4" id="footer-container-inner">
          © 2026 AI Music Therapy Companion. Powered by the Google Gemini API & Express CJS.
        </div>
      </footer>

    </div>
  );
}
