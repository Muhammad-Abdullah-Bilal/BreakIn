// ProfileHeader.tsx
export default function ProfileHeader({ profile }: { profile: any }) {
  return (
    <div className="flex items-center gap-4 p-4 bg-indigo-50 rounded-xl mb-4">
      <img src={profile.avatar} alt="avatar" className="w-16 h-16 rounded-full" />
      <div>
        <h2 className="font-bold text-lg">{profile.name}</h2>
        <p className="text-sm text-gray-600">{profile.tagline}</p>
      </div>
    </div>
  );
}
