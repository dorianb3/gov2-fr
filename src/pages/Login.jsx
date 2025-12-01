// src/pages/Login.jsx
import { useState } from "react";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const { loginWithGoogle, loginWithEmail, signupWithEmail } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const signInEmail = async () => {
    const { error } = await loginWithEmail(email, password);
    if (error) alert(error.message);
  };

  const signUpEmail = async () => {
    const { error } = await signupWithEmail(email, password);
    if (error) alert(error.message);
    else alert("Vérifie ton email pour confirmer ton compte !");
  };

  return (
    <div className="max-w-md mx-auto mt-20 flex flex-col gap-6 bg-neutral-900 p-8 rounded-lg border border-neutral-700">
      <h1 className="text-2xl font-semibold text-center">Login</h1>

      {/* Email Login */}
      <input
        type="email"
        placeholder="Email"
        className="input input-bordered w-full p-3 bg-neutral-800"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />

      <input
        type="password"
        placeholder="Password"
        className="input input-bordered w-full p-3 bg-neutral-800"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      <button
        onClick={signInEmail}
        className="bg-primary text-white py-2 rounded hover:bg-primary/80"
      >
        Login with Email
      </button>

      <button
        onClick={signUpEmail}
        className="bg-neutral-700 text-white py-2 rounded hover:bg-neutral-600"
      >
        Create Account
      </button>

      <div className="text-center opacity-60">— or —</div>

      <button
        onClick={loginWithGoogle}
        className="bg-red-600 py-2 rounded hover:bg-red-700"
      >
        Login with Google
      </button>
    </div>
  );
}
