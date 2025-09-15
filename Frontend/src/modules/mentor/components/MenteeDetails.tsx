import { Mentee, MenteeSubmission } from '../types/mentee';

interface MenteeDetailsProps {
  mentee: Mentee;
  submissions?: MenteeSubmission[];
  onBack: () => void;
  onReviewSubmission: (submission: MenteeSubmission) => void;
  loading?: boolean;
}

export function MenteeDetails({
  mentee,
  submissions = [],
  onBack,
  onReviewSubmission,
  loading = false,
}: MenteeDetailsProps) {
  const getSubmissionStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'reviewed':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'approved':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'rejected':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 shadow rounded-xl p-6">
      <button 
        onClick={onBack}
        className="flex items-center text-indigo-600 dark:text-indigo-400 mb-6"
      >
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          fill="none" 
          viewBox="0 0 24 24" 
          strokeWidth={1.5} 
          stroke="currentColor" 
          className="w-4 h-4 mr-1"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
        </svg>
        Back to mentees
      </button>

      <div className="flex items-start gap-4 mb-6">
        <div className="h-20 w-20 rounded-full overflow-hidden flex-shrink-0">
          {mentee.profileImage ? (
            <img 
              src={mentee.profileImage} 
              alt={mentee.name} 
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="h-full w-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center">
              <span className="text-3xl font-medium text-indigo-700 dark:text-indigo-300">
                {mentee.name.charAt(0)}
              </span>
            </div>
          )}
        </div>

        <div>
          <h2 className="text-2xl font-semibold">{mentee.name}</h2>
          <p className="text-gray-600 dark:text-gray-400">{mentee.email}</p>
          <div className="flex items-center gap-2 mt-1">
            <span className={`px-2 py-1 text-xs rounded-full 
              ${mentee.status === 'active' 
                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' 
                : mentee.status === 'inactive'
                ? 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
                : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
              }`}
            >
              {mentee.status.charAt(0).toUpperCase() + mentee.status.slice(1)}
            </span>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Joined {new Date(mentee.joinedAt).toLocaleDateString()}
            </span>
          </div>
        </div>
      </div>

      {mentee.bio && (
        <div className="mb-6">
          <h3 className="font-medium mb-1">Bio</h3>
          <p className="text-gray-700 dark:text-gray-300">{mentee.bio}</p>
        </div>
      )}

      <div className="mb-6">
        <h3 className="font-medium mb-2">Skills</h3>
        <div className="flex flex-wrap gap-2">
          {mentee.skills.map((skill, index) => (
            <span 
              key={index}
              className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300 rounded-full text-sm"
            >
              {skill}
            </span>
          ))}
        </div>
      </div>

      <div className="mb-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
          <h4 className="text-sm text-gray-600 dark:text-gray-400">Level</h4>
          <p className="text-lg font-medium">
            {mentee.level.charAt(0).toUpperCase() + mentee.level.slice(1)}
          </p>
        </div>
        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
          <h4 className="text-sm text-gray-600 dark:text-gray-400">Completed Tasks</h4>
          <p className="text-lg font-medium">{mentee.completedTasks}</p>
        </div>
        <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
          <h4 className="text-sm text-gray-600 dark:text-gray-400">Pending Tasks</h4>
          <p className="text-lg font-medium">{mentee.pendingTasks}</p>
        </div>
        <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
          <h4 className="text-sm text-gray-600 dark:text-gray-400">Last Active</h4>
          <p className="text-lg font-medium">
            {mentee.lastActivity 
              ? new Date(mentee.lastActivity).toLocaleDateString() 
              : 'Never'
            }
          </p>
        </div>
      </div>

      <div>
        <h3 className="font-medium mb-4">Recent Submissions</h3>

        {loading ? (
          <div className="space-y-4">
            {[...Array(2)].map((_, index) => (
              <div 
                key={index} 
                className="h-24 bg-gray-100 dark:bg-gray-700 animate-pulse rounded-lg"
              />
            ))}
          </div>
        ) : submissions.length === 0 ? (
          <div className="p-8 text-center bg-gray-50 dark:bg-gray-700 rounded-lg">
            <p className="text-gray-500 dark:text-gray-400">No submissions yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {submissions.map((submission) => (
              <div 
                key={submission.id}
                className="border dark:border-gray-700 p-4 rounded-lg"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-medium">Sprint: {submission.sprintId.substring(0, 8)}</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Submitted: {new Date(submission.submittedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <span 
                    className={`px-2 py-1 text-xs rounded-full ${getSubmissionStatusColor(submission.status)}`}
                  >
                    {submission.status.charAt(0).toUpperCase() + submission.status.slice(1)}
                  </span>
                </div>
                
                <div className="mt-2 border-t dark:border-gray-700 pt-2">
                  <p className="text-sm line-clamp-2">
                    {submission.content.substring(0, 100)}
                    {submission.content.length > 100 ? '...' : ''}
                  </p>
                </div>

                {submission.status === 'pending' && (
                  <div className="mt-3 flex justify-end">
                    <button
                      onClick={() => onReviewSubmission(submission)}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-sm"
                    >
                      Review
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
