"use client";

import { createContext, useContext } from "react";

// Types
export interface Brand {
  id: string;
  name: string;
  description: string;
  icon: string;
}

export interface EvidenceItem {
  finding: string;
  source: string;
  sourceUrl: string;
  quality: "High" | "Moderate" | "Emerging";
}

export interface KnowledgeBomb {
  text: string;
}

export interface ContentAngle {
  id: string;
  title: string;
  mainstreamView: string;
  cuttingEdgeView: string;
  selected: boolean;
}

export interface ResearchBrief {
  topic: string;
  coreThesis: string;
  evidence: EvidenceItem[];
  knowledgeBombs: KnowledgeBomb[];
  angles: ContentAngle[];
}

export interface ContentPiece {
  id: string;
  type: "talking_head" | "carousel";
  title: string;
  content: string;
  onScreenText?: string;
  caption?: string;
  slides?: { slideTitle: string; onScreenText: string; caption: string }[];
  status: "draft" | "ready" | "scheduled" | "published";
  scheduledDate?: string;
  approved: boolean;
  createdAt: string;
}

export interface AppState {
  currentTab: string;
  selectedBrand: Brand | null;
  researchBrief: ResearchBrief | null;
  generatedContent: ContentPiece[];
  contentQueue: ContentPiece[];
  isResearching: boolean;
  isGenerating: boolean;
}

export const initialState: AppState = {
  currentTab: "start",
  selectedBrand: null,
  researchBrief: null,
  generatedContent: [],
  contentQueue: [],
  isResearching: false,
  isGenerating: false,
};

export type AppAction =
  | { type: "SET_TAB"; payload: string }
  | { type: "SELECT_BRAND"; payload: Brand }
  | { type: "SET_RESEARCHING"; payload: boolean }
  | { type: "SET_RESEARCH_BRIEF"; payload: ResearchBrief }
  | { type: "TOGGLE_ANGLE"; payload: string }
  | { type: "SET_GENERATING"; payload: boolean }
  | { type: "ADD_CONTENT"; payload: ContentPiece[] }
  | { type: "APPROVE_CONTENT"; payload: string }
  | { type: "MOVE_TO_QUEUE"; payload: string }
  | { type: "SCHEDULE_CONTENT"; payload: { id: string; date: string } }
  | { type: "UPDATE_CONTENT"; payload: { id: string; content: string } }
  | { type: "RESET_RESEARCH" };

export function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case "SET_TAB":
      return { ...state, currentTab: action.payload };
    case "SELECT_BRAND":
      return { ...state, selectedBrand: action.payload, currentTab: "start" };
    case "SET_RESEARCHING":
      return { ...state, isResearching: action.payload };
    case "SET_RESEARCH_BRIEF":
      return { ...state, researchBrief: action.payload, isResearching: false };
    case "TOGGLE_ANGLE":
      if (!state.researchBrief) return state;
      return {
        ...state,
        researchBrief: {
          ...state.researchBrief,
          angles: state.researchBrief.angles.map((a) =>
            a.id === action.payload ? { ...a, selected: !a.selected } : a
          ),
        },
      };
    case "SET_GENERATING":
      return { ...state, isGenerating: action.payload };
    case "ADD_CONTENT":
      return {
        ...state,
        generatedContent: [...state.generatedContent, ...action.payload],
        isGenerating: false,
      };
    case "APPROVE_CONTENT":
      return {
        ...state,
        generatedContent: state.generatedContent.map((c) =>
          c.id === action.payload ? { ...c, approved: true, status: "ready" as const } : c
        ),
      };
    case "MOVE_TO_QUEUE":
      const piece = state.generatedContent.find((c) => c.id === action.payload);
      if (!piece) return state;
      return {
        ...state,
        generatedContent: state.generatedContent.filter(
          (c) => c.id !== action.payload
        ),
        contentQueue: [...state.contentQueue, { ...piece, status: "ready" }],
      };
    case "SCHEDULE_CONTENT":
      return {
        ...state,
        contentQueue: state.contentQueue.map((c) =>
          c.id === action.payload.id
            ? { ...c, scheduledDate: action.payload.date, status: "scheduled" as const }
            : c
        ),
      };
    case "UPDATE_CONTENT":
      return {
        ...state,
        generatedContent: state.generatedContent.map((c) =>
          c.id === action.payload.id
            ? { ...c, content: action.payload.content }
            : c
        ),
      };
    case "RESET_RESEARCH":
      return {
        ...state,
        researchBrief: null,
        generatedContent: [],
      };
    default:
      return state;
  }
}

export const AppContext = createContext<{
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
}>({ state: initialState, dispatch: () => {} });

export function useApp() {
  return useContext(AppContext);
}
