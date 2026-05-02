import { headers } from "next/headers";
import { jwtVerify } from "jose";
import { getServerSession } from "next-auth";
import { authOptions } from "./auth";

export async function getAuthUserId(): Promise<string | null> {
  const authHeader = headers().get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    try {
      const token = authHeader.slice(7);
      const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET!);
      const { payload } = await jwtVerify(token, secret);
      return (payload.sub as string) ?? null;
    } catch {
      return null;
    }
  }

  const session = await getServerSession(authOptions);
  const user = session?.user as ({ id?: string } & Record<string, unknown>) | undefined;
  return user?.id ?? null;
}
