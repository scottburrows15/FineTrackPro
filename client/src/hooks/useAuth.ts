import { useQuery } from "@tanstack/react-query";
import type { UserWithTeam } from "@shared/schema";

export function useAuth() {
  const { data: user, isLoading } = useQuery<UserWithTeam | null>({
    queryKey: ["/api/auth/user"],
    retry: false,
  });

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
  };
}
