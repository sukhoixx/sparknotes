import { NextRequest, NextResponse } from "next/server";
import { createRemoteJWKSet, jwtVerify, SignJWT } from "jose";
import { prisma } from "@/lib/prisma";

const APPLE_JWKS = createRemoteJWKSet(new URL("https://appleid.apple.com/auth/keys"));
const GOOGLE_JWKS = createRemoteJWKSet(new URL("https://www.googleapis.com/oauth2/v3/certs"));

export async function POST(req: NextRequest) {
  const { provider, idToken } = await req.json();

  let providerId: string;
  let email: string | null = null;
  let name: string | null = null;

  try {
    if (provider === "apple") {
      const { payload } = await jwtVerify(idToken, APPLE_JWKS, {
        issuer: "https://appleid.apple.com",
        audience: process.env.APPLE_BUNDLE_ID!,
      });
      providerId = payload.sub as string;
      email = (payload.email as string) ?? null;
    } else if (provider === "google") {
      const { payload } = await jwtVerify(idToken, GOOGLE_JWKS, {
        issuer: ["accounts.google.com", "https://accounts.google.com"],
        audience: process.env.GOOGLE_CLIENT_ID!,
      });
      providerId = payload.sub as string;
      email = (payload.email as string) ?? null;
      name = (payload.name as string) ?? null;
    } else {
      return NextResponse.json({ error: "Unknown provider" }, { status: 400 });
    }
  } catch {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }

  // Find or create User + Account
  let account = await prisma.account.findUnique({
    where: { provider_providerAccountId: { provider, providerAccountId: providerId } },
    select: { userId: true },
  });

  if (!account) {
    const user = await prisma.user.create({
      data: {
        email,
        name,
        accounts: {
          create: { type: "oauth", provider, providerAccountId: providerId },
        },
      },
      select: { id: true },
    });
    account = { userId: user.id };
  }

  const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET!);
  const token = await new SignJWT({ sub: account.userId })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("30d")
    .sign(secret);

  return NextResponse.json({ token });
}
