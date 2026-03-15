"use client";

import { Archive } from "lucide-react";

export default function VaultView() {
  return (
    <div className="flex-1 flex items-center justify-center text-gray-500">
      <div className="text-center">
        <Archive size={48} className="mx-auto mb-4" />
        <h2 className="text-xl font-semibold mb-2">Vault</h2>
        <p className="text-sm">Saved research briefs, templates, and brand voices will appear here.</p>
        <p className="text-xs mt-2 text-gray-600">Coming soon</p>
      </div>
    </div>
  );
}
