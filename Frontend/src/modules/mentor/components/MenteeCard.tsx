import { Mentee } from '../types/mentee';

interface MenteeCardProps {
  mentee: Mentee;
  onSelect: (mentee: Mentee) => void;
}

export function MenteeCard({ mentee, onSelect }: MenteeCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'inactive':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
      case 'onboarding':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  return (
    <div 
      className="p-4 bg-white dark:bg-gray-800 rounded-xl shadow hover:shadow-lg transition mb-4 cursor-pointer"
      onClick={() => onSelect(mentee)}
    >
      <div className="flex items-start gap-3">
        <div className="h-12 w-12 rounded-full overflow-hidden flex-shrink-0">
          {mentee.profileImage ? (
            <img 
              src={mentee.profileImage} 
              alt={mentee.name} 
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="h-full w-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center">
              <span className="text-lg font-medium text-indigo-700 dark:text-indigo-300">
                {mentee.name.charAt(0)}
              </span>
            </div>
          )}
        </div>

        <div className="flex-1">
          <div className="flex justify-between items-start">
            <h3 className="font-semibold">{mentee.name}</h3>
            <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(mentee.status)}`}>
              {mentee.status.charAt(0).toUpperCase() + mentee.status.slice(1)}
            </span>
          </div>
          
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Level: {mentee.level.charAt(0).toUpperCase() + mentee.level.slice(1)}
          </p>
          
          <div className="mt-2 flex gap-1 flex-wrap">
            {mentee.skills.slice(0, 3).map((skill, index) => (
              <span 
                key={index}
                className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300 rounded text-xs"
              >
                {skill}
              </span>
            ))}
            {mentee.skills.length > 3 && (
              <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300 rounded text-xs">
                +{mentee.skills.length - 3}
              </span>
            )}
          </div>

          <div className="mt-2 grid grid-cols-2 gap-2">
            <div className="text-center p-1 bg-green-50 dark:bg-green-900/30 rounded">
              <span className="block text-xs text-gray-600 dark:text-gray-400">Completed</span>
              <span className="font-semibold">{mentee.completedTasks}</span>
            </div>
            <div className="text-center p-1 bg-yellow-50 dark:bg-yellow-900/30 rounded">
              <span className="block text-xs text-gray-600 dark:text-gray-400">Pending</span>
              <span className="font-semibold">{mentee.pendingTasks}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
