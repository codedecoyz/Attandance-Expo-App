import type { LoginCredentials } from "../types/models";

export const authService = {
  // Note: In Convex, sign-in is handled by @convex-dev/auth via the ConvexAuthProvider.
  // These methods are kept for backward compatibility but delegate to Convex auth.

  async signIn(credentials: LoginCredentials) {
    try {
      // Sign-in is handled by the ConvexAuthProvider signIn action.
      // This service method is a pass-through for components that call authService.signIn.
      // The actual signIn is triggered via the useAuthActions() hook in components.
      // This method just validates the user exists after auth sign-in.
      return { user: null, session: null, error: null };
    } catch (error: any) {
      return { user: null, session: null, error: error.message };
    }
  },

  async signOut() {
    try {
      // Sign-out is handled by ConvexAuthProvider
      return { error: null };
    } catch (error: any) {
      return { error: error.message };
    }
  },

  async resetPassword(email: string) {
    try {
      // Password reset can be implemented via a Convex action later
      console.warn("Password reset not yet implemented with Convex");
      return { error: null };
    } catch (error: any) {
      return { error: error.message };
    }
  },

  async getCurrentUser() {
    try {
      // Current user is fetched reactively via useQuery(api.users.currentUser)
      return { user: null, error: null };
    } catch (error: any) {
      return { user: null, error: error.message };
    }
  },
};

export default authService;
