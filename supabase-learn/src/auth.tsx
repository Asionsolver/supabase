import { useState, type FormEvent } from "react";
import { supabase } from "./supabase-client";

const Auth = () => {
  const [isSignIn, setIsSignin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (isSignIn) {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) {
        console.log("Error while SignIn", error.message);
      }
    } else {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) {
        console.log("Error while SignUp", error.message);
      }
    }
    console.log();
  };
  return (
    <div className="auth-container">
      <h1 className="auth-title">{isSignIn ? "Sign In" : "Sign Up"}</h1>
      <form action="" className="auth-form" onSubmit={handleSubmit}>
        <input
          type="email"
          name="email"
          id="email"
          placeholder="Enter your email"
          className="auth-input"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="password"
          name="password"
          id="password"
          placeholder="Enter your password"
          className="auth-input"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button type="submit" className="auth-button">
          {isSignIn ? "Sign In" : "Sign Up"}
        </button>
      </form>

      <p className="auth-toggle">
        {isSignIn ? "Don't have an account?" : "Already have an account?"}
        <span
          className="auth-link"
          onClick={() => {
            setIsSignin(!isSignIn);
            setEmail("");
            setPassword("");
          }}
        >
          {isSignIn ? "Sign Up" : "Sign In"}
        </span>
      </p>
    </div>
  );
};

export default Auth;
