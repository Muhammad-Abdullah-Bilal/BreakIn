import { useForm } from "react-hook-form";

export default function LoginForm({ onSubmit }: { onSubmit: (data: any) => void }) {
  const { register, handleSubmit, formState: { errors } } = useForm();
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label className="block mb-1 font-medium">Email</label>
        <input type="email" {...register("email", { required: true })} className="border rounded px-3 py-2 w-full" />
        {errors.email && <span className="text-red-500 text-xs">Email is required</span>}
      </div>
      <div>
        <label className="block mb-1 font-medium">Password</label>
        <input type="password" {...register("password", { required: true })} className="border rounded px-3 py-2 w-full" />
        {errors.password && <span className="text-red-500 text-xs">Password is required</span>}
      </div>
      <button type="submit" className="w-full bg-indigo-600 text-white py-2 rounded">Login</button>
    </form>
  );
}
