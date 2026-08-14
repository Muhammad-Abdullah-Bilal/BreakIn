'use client';

import { useForm } from "react-hook-form";

export default function LoginForm({ onSubmit }: { onSubmit: (data: any) => void }) {
  const { register, handleSubmit, formState: { errors } } = useForm();
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label className="block mb-1 font-medium text-slate-200">Email</label>
        <input 
          type="email" 
          {...register("email", { required: true })} 
          className="bg-slate-900 border border-slate-700 rounded px-3 py-2 w-full text-white focus:outline-none focus:ring-2 focus:ring-blue-500" 
        />
        {errors.email && <span className="text-red-400 text-xs">Email is required</span>}
      </div>
      <div>
        <label className="block mb-1 font-medium text-slate-200">Password</label>
        <input 
          type="password" 
          {...register("password", { required: true })} 
          className="bg-slate-900 border border-slate-700 rounded px-3 py-2 w-full text-white focus:outline-none focus:ring-2 focus:ring-blue-500" 
        />
        {errors.password && <span className="text-red-400 text-xs">Password is required</span>}
      </div>
      <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white font-medium py-2 rounded transition-colors">
        Login
      </button>
    </form>
  );
}
