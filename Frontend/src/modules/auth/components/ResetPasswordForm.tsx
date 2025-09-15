import { useForm } from "react-hook-form";

export default function ResetPasswordForm({ onSubmit }: { onSubmit: (data: any) => void }) {
  const { register, handleSubmit, formState: { errors } } = useForm();
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label className="block mb-1 font-medium">New Password</label>
        <input type="password" {...register("password", { required: true, minLength: 6 })} className="border rounded px-3 py-2 w-full" />
        {errors.password && <span className="text-red-500 text-xs">Password is required (min 6 chars)</span>}
      </div>
      <button type="submit" className="w-full bg-indigo-600 text-white py-2 rounded">Reset Password</button>
    </form>
  );
}
