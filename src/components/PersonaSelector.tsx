import { PERSONAS, Persona } from "../types";
import { HeartHandshake, Zap, BookOpen, Music } from "lucide-react";

interface PersonaSelectorProps {
  selectedPersona: Persona;
  onSelectPersona: (persona: Persona) => void;
}

export default function PersonaSelector({
  selectedPersona,
  onSelectPersona,
}: PersonaSelectorProps) {
  // Map icons to components
  const renderIcon = (iconName: string) => {
    switch (iconName) {
      case "HeartHandshake":
        return <HeartHandshake className="w-5 h-5" id="persona-icon-hearthandshake" />;
      case "Zap":
        return <Zap className="w-5 h-5" id="persona-icon-zap" />;
      case "BookOpen":
        return <BookOpen className="w-5 h-5" id="persona-icon-bookopen" />;
      case "Music":
        return <Music className="w-5 h-5" id="persona-icon-music" />;
      default:
        return <Music className="w-5 h-5" id="persona-icon-default" />;
    }
  };

  return (
    <div className="bg-white/95 backdrop-blur-md rounded-2xl border border-slate-100 p-5 shadow-xs space-y-4" id="persona-selector-card">
      <div id="persona-selector-header">
        <h3 className="text-sm font-bold text-slate-900 tracking-tight" id="persona-header-title">
          음악 테라피 큐레이터 선택
        </h3>
        <p className="text-xs text-slate-400 mt-1 pb-1 border-b border-slate-50" id="persona-header-desc">
          당신의 마음 날씨를 어루만질 대화 상대를 선택하세요.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-2.5" id="persona-list">
        {PERSONAS.map((persona) => {
          const isSelected = selectedPersona.id === persona.id;
          return (
            <button
              key={persona.id}
              onClick={() => onSelectPersona(persona)}
              id={`persona-btn-${persona.id}`}
              className={`w-full flex items-start gap-3.5 p-3 rounded-xl text-left border transition-all duration-200 cursor-pointer ${
                isSelected
                  ? "bg-indigo-50/70 border-indigo-200 text-indigo-950 shadow-xs"
                  : "bg-slate-50/50 border-slate-100 text-slate-700 hover:bg-slate-100/70 hover:border-slate-200"
              }`}
            >
              <div
                id={`persona-icon-wrapper-${persona.id}`}
                className={`p-2 rounded-lg shrink-0 ${
                  isSelected
                    ? "bg-indigo-600 text-white"
                    : "bg-slate-200 text-slate-600"
                }`}
              >
                {renderIcon(persona.icon)}
              </div>
              <div className="min-w-0 flex-1" id={`persona-meta-wrapper-${persona.id}`}>
                <div className="font-semibold text-xs flex items-center justify-between gap-1.5 text-slate-900" id={`persona-name-${persona.id}`}>
                  <span>{persona.name}</span>
                  {isSelected && (
                    <span 
                      id={`persona-badge-${persona.id}`}
                      className="px-1.5 py-0.5 rounded-full bg-indigo-100 text-[9px] font-bold text-indigo-700 leading-none"
                    >
                      ON
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 mt-1.5 leading-relaxed" id={`persona-desc-${persona.id}`}>
                  {persona.description}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

