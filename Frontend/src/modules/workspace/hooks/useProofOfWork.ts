// useProofOfWork hook

import { useState } from "react";
import type { Proof } from "../types/proof";

const MOCK_PROOF: Proof = {
	sprints: [
		{ id: "1", title: "Frontend Challenge", score: 95, verified: true },
		{ id: "2", title: "API Integration", score: 88, verified: false },
	],
};

export function useProofOfWork(userId?: string) {
	// In real app, fetch from API
	const [proof] = useState<Proof>(MOCK_PROOF);
	return { data: proof };
}
