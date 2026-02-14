import { type NextRequest } from "next/server";
import { jwtVerify } from "jose";

import { prisma } from "@/lib/prisma";

const SESSION_COOKIE_NAME = "smoove_session";

function getSessionSecret() {
  const secret =
    process.env.SESSION_SECRET ?? process.env.NEXTAUTH_SECRET ?? "dev-only-secret-change-me";
  return new TextEncoder().encode(secret);
}

export async function getRequestUser(request: NextRequest) {
  const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (!sessionCookie) {
    return null;
  }

  try {
    const { payload } = await jwtVerify(sessionCookie, getSessionSecret());
    if (!payload.sub) {
      return null;
    }
    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
    });
    return user;
  } catch {
    return null;
  }
}
