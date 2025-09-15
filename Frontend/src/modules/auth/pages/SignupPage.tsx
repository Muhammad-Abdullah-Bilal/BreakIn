import SignupForm from "../components/SignupForm";

export default function SignupPage() {
  function handleSignup(data: any) {
    // TODO: Integrate with API
    alert(`Signup: ${JSON.stringify(data)}`);
  }
  return (
    <div className="max-w-sm mx-auto py-12">
      <h1 className="text-2xl font-bold mb-6">Sign Up</h1>
      <SignupForm onSubmit={handleSignup} />
    </div>
  );
}
