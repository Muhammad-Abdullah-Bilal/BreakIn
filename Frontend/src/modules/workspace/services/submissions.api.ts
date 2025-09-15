// submissions.api: create/list submissions

// Mocked uploadSubmission function
export function uploadSubmission({ sprintId, file }: { sprintId: string; file: File }) {
	return new Promise((resolve) => {
		setTimeout(() => {
			resolve({ success: true, sprintId, fileName: file.name });
		}, 1200);
	});
}
