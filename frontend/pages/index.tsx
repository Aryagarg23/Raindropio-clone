import { useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function Home() {
  const signInWithGoogle = async () => {
    await supabase.auth.signInWithOAuth({ provider: "google" });
  };

  return (
    <main style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100vh" }}>
      <h1>Raindropio Clone</h1>
      <button onClick={signInWithGoogle} style={{ padding: "1em 2em", fontSize: "1.2em" }}>
        Sign in with Google
      </button>
    </main>
  );
}
