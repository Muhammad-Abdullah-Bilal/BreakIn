"use client";

// useSprints hook
import { useState } from "react";
import type { Sprint } from "../types/sprint";

// Mocked sprints data
const MOCK_SPRINTS: Sprint[] = [
	{
		id: "1",
		title: "Frontend Challenge",
		description: "Build a responsive dashboard UI.",
		deadline: new Date(Date.now() + 1000 * 60 * 60 * 24 * 2).toISOString(),
		tasks: ["Setup project", "Implement layout", "Add charts"],
	},
	{
		id: "2",
		title: "API Integration",
		description: "Integrate with backend APIs.",
		deadline: new Date(Date.now() + 1000 * 60 * 60 * 24 * 5).toISOString(),
		tasks: ["Auth flow", "Data fetching", "Error handling"],
	},
];

export function useSprints() {
	// In real app, fetch from API
	const [sprints] = useState<Sprint[]>(MOCK_SPRINTS);
	return { sprints };
}
