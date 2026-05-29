import { PERSONAS, Persona } from "../types";
import { Sparkles, Code, Languages, PenTool } from "lucide-react";

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
      case "Sparkles":
        return <Sparkles className="w-5 h-5" id="persona-icon-sparkles" />;
      case "Code":
        return <Code className="w-5 h-5" id="persona-icon-code" />;
      case "Languages":
        return <Languages className="w-5 h-5" id="persona-icon-languages" />;
      case "PenTool":
        return <PenTool className="w-5 h-5" id="persona-icon-pentool" />;
      default:
        return <Sparkles className="w-5 h-5" id="persona-icon-default" />;
    }
  };

  return (
    <div className="bg-white/90 backdrop-blur-md rounded-2xl border border-slate-100 p-5 shadow-sm space-y-4" id="persona-selector-card">
      <div id="persona-selector-header">
        <h3 className="text-sm font-semibold text-slate-800 tracking-tight" id="persona-header-title">
          디지털 페르소나 설정
        </h3>
        <p className="text-xs text-slate-400 mt-1" id="persona-header-desc">
          AI의 전문 분야 및 대화 방식을 선택하세요.
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
                  ? "bg-indigo-50 border-indigo-200 text-indigo-900 shadow-sm shadow-indigo-50/50"
                  : "bg-slate-50 border-slate-100 text-slate-700 hover:bg-slate-100/70 hover:border-slate-200"
              }`}
            >
              <div
                id={`persona-icon-wrapper-${persona.id}`}
                className={`p-2 rounded-lg shrink-0 ${
                  isSelected
                    ? "bg-indigo-500 text-white"
                    : "bg-slate-200 text-slate-600"
                }`}
              >
                {renderIcon(persona.icon)}
              </div>
              <div id={`persona-meta-wrapper-${persona.id}`}>
                <div className="font-semibold text-xs flex items-center gap-1.5" id={`persona-name-${persona.id}`}>
                  {persona.name}
                  {isSelected && (
                    <span 
                      id={`persona-badge-${persona.id}`}
                      className="px-1.5 py-0.5 rounded-full bg-indigo-100 text-[10px] font-medium text-indigo-700 animate-pulse"
                    >
                      활성
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 mt-1 leading-relaxed" id={`persona-desc-${persona.id}`}>
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
