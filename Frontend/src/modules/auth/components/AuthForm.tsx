// AuthForm: reusable form wrapper
export function AuthForm({ children, ...props }: any) {
  return <form {...props}>{children}</form>;
}
