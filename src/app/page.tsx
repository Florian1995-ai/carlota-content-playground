"use client";

import Sidebar from "@/components/Sidebar";
import { useApp } from "@/lib/store";
import StartView from "@/components/views/StartView";
import EditView from "@/components/views/EditView";
import PlanView from "@/components/views/PlanView";
import VaultView from "@/components/views/VaultView";
import StrategyView from "@/components/views/StrategyView";

export default function Home() {
  const { state } = useApp();

  const renderView = () => {
    switch (state.currentTab) {
      case "start":
        return <StartView />;
      case "edit":
        return <EditView />;
      case "plan":
        return <PlanView />;
      case "vault":
        return <VaultView />;
      case "strategy":
        return <StrategyView />;
      default:
        return <StartView />;
    }
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">{renderView()}</main>
    </div>
  );
}
