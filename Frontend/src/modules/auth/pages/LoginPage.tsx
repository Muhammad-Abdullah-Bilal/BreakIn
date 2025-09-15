import LoginForm from "../components/LoginForm";

export default function LoginPage() {
  function handleLogin(data: any) {
    // TODO: Integrate with NextAuth or custom API
    alert(`Login: ${JSON.stringify(data)}`);
  }
  return (
    <div className="max-w-sm mx-auto py-12">
      <h1 className="text-2xl font-bold mb-6">Sign In</h1>
      <LoginForm onSubmit={handleLogin} />
    </div>
  );
}
