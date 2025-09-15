import { useState } from "react";

let toastId = 0;
export function useToast() {
  const [toasts, setToasts] = useState<any[]>([]);
  function addToast(message: string) {
    setToasts((t) => [...t, { id: ++toastId, message }]);
    setTimeout(() => removeToast(toastId), 4000);
  }
  function removeToast(id: number) {
    setToasts((t) => t.filter((toast) => toast.id !== id));
  }
  return { toasts, addToast, removeToast };
}
