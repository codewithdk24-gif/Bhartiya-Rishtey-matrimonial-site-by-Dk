export function getProfileImage(profile: any): string {
  if (!profile) return '';

  // 1. Check primary profilePhoto
  if (profile.profilePhoto) return profile.profilePhoto;

  // 2. Check photos array
  if (profile.photos) {
    try {
      const photos = typeof profile.photos === "string"
        ? JSON.parse(profile.photos)
        : profile.photos;

      if (Array.isArray(photos) && photos.length > 0) return photos[0];
    } catch (e) {
      console.error("Error parsing profile photos:", e);
    }
  }

  // 3. Fallback
  return '';
}
