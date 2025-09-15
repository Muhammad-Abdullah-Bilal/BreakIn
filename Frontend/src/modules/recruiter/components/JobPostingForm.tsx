import { useForm } from "react-hook-form";

export default function JobPostingForm({ initial }: { initial?: any }) {
  const { register, handleSubmit } = useForm({ defaultValues: initial });
  function onSubmit(data: any) {
    alert(`Save posting: ${JSON.stringify(data)}`);
  }
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 bg-white rounded-xl shadow p-4">
      <div>
        <label className="block mb-1">Title</label>
        <input {...register('title')} className="w-full border rounded px-3 py-2" />
      </div>
      <div>
        <label className="block mb-1">Description</label>
        <textarea {...register('description')} className="w-full border rounded px-3 py-2" />
      </div>
      <div className="flex gap-2">
        <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded">Save</button>
        <button type="button" className="px-4 py-2 bg-gray-200 rounded">Cancel</button>
      </div>
    </form>
  );
}
