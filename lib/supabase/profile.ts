import type { User } from "@supabase/supabase-js";

import type { UserProfile } from "@/lib/types/inventory";

import { createActionClient } from "./action";
import { createClient } from "./server";

export type ProfileClientMode = "server" | "action";

export type SidebarUser = {
  name: string;
  email: string;
  avatar: string;
};

export type CurrentUserProfile = {
  user: User;
  profile: UserProfile | null;
  sidebarUser: SidebarUser;
};

type ProfileRow = UserProfile;

function toSidebarUser(user: User, profile: UserProfile | null): SidebarUser {
  const userMetadata = (user.user_metadata ?? {}) as Record<string, unknown>;
  const metadataFullName =
    typeof userMetadata.full_name === "string"
      ? userMetadata.full_name
      : undefined;
  const metadataAvatar =
    typeof userMetadata.avatar_url === "string" ? userMetadata.avatar_url : "";

  return {
    name:
      profile?.full_name ??
      metadataFullName ??
      user.email?.split("@")[0] ??
      "User",
    email: profile?.email ?? user.email ?? "",
    avatar: metadataAvatar,
  };
}

export async function getCurrentUserProfile(
  mode: ProfileClientMode = "server",
): Promise<CurrentUserProfile | null> {
  const supabase =
    mode === "action" ? await createActionClient() : await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return null;
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("id, email, full_name, role")
    .eq("id", user.id)
    .maybeSingle();

  if (error) {
    console.error("Failed to fetch current profile:", error.message);
  }

  const row = (data as ProfileRow | null) ?? null;
  const profile = row
    ? ({
        id: row.id,
        email: row.email,
        full_name: row.full_name,
        role: row.role,
      } as UserProfile)
    : null;

  return {
    user,
    profile,
    sidebarUser: toSidebarUser(user, profile),
  };
}
