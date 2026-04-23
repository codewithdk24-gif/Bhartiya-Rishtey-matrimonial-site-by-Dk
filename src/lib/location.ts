export function formatLocation(profile: any): string {
  if (!profile) return "India";
  if (profile.city && profile.city !== 'Unknown') {
    return profile.state && profile.state !== 'Unknown' 
      ? `${profile.city}, ${profile.state}` 
      : profile.city;
  }
  if (profile.state && profile.state !== 'Unknown') return profile.state;
  return "India";
}
