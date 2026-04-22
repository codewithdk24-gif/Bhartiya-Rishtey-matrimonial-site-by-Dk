import { signOut } from "next-auth/react";

/**
 * Standard centralized logout function for Bhartiya Rishtey.
 * Uses NextAuth signOut and a hard redirect to ensure clean state.
 */
export const handleLogout = async () => {
  try {
    // Perform NextAuth signOut without automatic redirect
    await signOut({ redirect: false });

    // Force a hard redirect to the landing page to reset application state
    window.location.href = "/";
  } catch (error) {
    console.error("Logout failed:", error);
    window.location.href = "/";
  }
};
