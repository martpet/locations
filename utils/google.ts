export interface GoogleUser {
  "id": string;
  "name": string;
  "given_name": string;
  "family_name": string;
  "picture": string;
  "locale": string;
  "email": string;
  "verified_email": boolean;
}

export async function fetchGoogleUser(token: string): Promise<GoogleUser> {
  const resp = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!resp.ok) {
    throw new Error("Failed to fetch Google user");
  }
  return await resp.json();
}
