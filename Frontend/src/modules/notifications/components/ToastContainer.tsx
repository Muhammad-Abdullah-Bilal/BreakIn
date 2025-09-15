import { useToast } from "../hooks/useToast";

export default function ToastContainer() {
  const { toasts, removeToast } = useToast();
  return (
    <div className="fixed bottom-4 right-4 z-50 space-y-2 max-w-xs w-full">
      {toasts.map((toast: any) => (
        <div key={toast.id} className="bg-black text-white rounded-lg shadow p-3 flex items-center justify-between animate-fade-in">
          <span>{toast.message}</span>
          <button onClick={() => removeToast(toast.id)} className="ml-3 text-lg">×</button>
        </div>
      ))}
    </div>
  );
}
