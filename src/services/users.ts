// another fake backend (sep file to follow backend api structure
// of splitting auth and users)
function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function updateProfile(
  token: string,
  input: { username: string; sport: string }
): Promise<void> {
  await delay(600);
  console.log('Fake PATCH /users/me with token:', token, input);
}