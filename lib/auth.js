async function signInWithGoogle({ supabase, setError }) {
  setError(null);
  const { error: signInError } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${window.location.origin}/dashboard`,
      queryParams: {
        prompt: "select_account",
      },
    },
  });
  if (signInError) {
    setError(signInError.message);
  }
}

async function signOut({ supabase }) {
  await supabase.auth.signOut({ scope: "local" });
}

export { signInWithGoogle, signOut };
