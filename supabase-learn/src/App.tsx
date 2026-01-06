import { useEffect, useState } from "react";
import Auth from "./auth";
import TaskManager from "./components/task-manager";
import { supabase } from "./supabase-client";
import type { Session } from "@supabase/supabase-js";

function App() {
  const [userSession, setUserSession] = useState<Session | null>(null);

  useEffect(() => {
    const fetchUserSession = async () => {
      const currentSession = await supabase.auth.getSession();
      console.log(currentSession);
      setUserSession(currentSession.data.session);
    };

    fetchUserSession();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUserSession(session);
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };
  return (
    <>
      {userSession ? (
        <>
          <div className="flex w-full mt-4 pr-4 justify-end">
            <button
              className="px-3 py-2 text-white font-semibold bg-red-500 hover:bg-red-700 rounded-md"
              onClick={handleLogout}
            >
              Logout
            </button>
          </div>
          <TaskManager session={userSession} />
        </>
      ) : (
        <Auth />
      )}
    </>
  );
}

export default App;
