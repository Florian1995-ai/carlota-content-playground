"use client";

import { Brain } from "lucide-react";

export default function StrategyView() {
  return (
    <div className="flex-1 flex items-center justify-center text-gray-500">
      <div className="text-center">
        <Brain size={48} className="mx-auto mb-4" />
        <h2 className="text-xl font-semibold mb-2">Strategy</h2>
        <p className="text-sm">Content strategy, analytics, and performance insights will appear here.</p>
        <p className="text-xs mt-2 text-gray-600">Coming soon</p>
      </div>
    </div>
  );
}
