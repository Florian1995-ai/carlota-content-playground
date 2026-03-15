"use client";

import { useApp } from "@/lib/store";
import {
  Rocket,
  PenLine,
  Calendar,
  Archive,
  Brain,
} from "lucide-react";

const tabs = [
  { id: "start", label: "Start", icon: Rocket },
  { id: "edit", label: "Edit", icon: PenLine },
  { id: "plan", label: "Plan", icon: Calendar },
  { id: "vault", label: "Vault", icon: Archive },
  { id: "strategy", label: "Strategy", icon: Brain },
];

export default function Sidebar() {
  const { state, dispatch } = useApp();

  return (
    <div className="w-16 flex flex-col items-center py-4 gap-2"
      style={{ backgroundColor: "var(--sidebar-bg)", borderRight: "1px solid var(--card-border)" }}>
      {/* Logo */}
      <div className="w-10 h-10 rounded-full overflow-hidden mb-4 flex items-center justify-center"
        style={{ backgroundColor: "var(--sidebar-bg)" }}>
        <img src="/favicon-carlota.png" alt="Carlota" className="w-9 h-9 object-contain" />
      </div>

      {/* Tabs */}
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = state.currentTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => dispatch({ type: "SET_TAB", payload: tab.id })}
            className="w-12 h-12 flex flex-col items-center justify-center rounded-lg text-xs gap-0.5 cursor-pointer"
            style={{
              backgroundColor: isActive ? "var(--card-bg)" : "transparent",
              color: isActive ? "var(--accent)" : "#888",
            }}
            title={tab.label}
          >
            <Icon size={20} />
            <span className="text-[10px]">{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
}
