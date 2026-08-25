export type ProfileCompletionFields = {
  full_name: string | null;
  bio: string | null;
  github_username: string | null;
  username: string | null;
};

// Update this list as more profile fields get added later.
export function isProfileComplete(profile: ProfileCompletionFields): boolean {
  return Boolean(
    profile.full_name?.trim() &&
      profile.bio?.trim() &&
      profile.github_username?.trim() &&
    profile.username?.trim(),
  );
}
