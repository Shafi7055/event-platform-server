function mapGoogleProfile(profile) {
  if (!profile || typeof profile.id !== 'string' || profile.id.length === 0) {
    throw new Error('Google profile is missing its account ID');
  }

  const email = profile.emails?.find((entry) => typeof entry.value === 'string')?.value?.trim();
  if (!email) {
    throw new Error('Google profile is missing an email address');
  }

  return {
    id: profile.id,
    email: email.toLowerCase(),
    name: typeof profile.displayName === 'string' ? profile.displayName : '',
    photo: profile.photos?.find((entry) => typeof entry.value === 'string')?.value,
  };
}

module.exports = { mapGoogleProfile };
