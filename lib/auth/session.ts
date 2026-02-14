import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SignJWT, jwtVerify } from "jose";

import { prisma } from "@/lib/prisma";

const SESSION_COOKIE_NAME = "smoove_session";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 14;

type SessionPayload = {
  sub: string;
  phone: string;
};

function getSessionSecret() {
  const secret =
    process.env.SESSION_SECRET ?? process.env.NEXTAUTH_SECRET ?? "dev-only-secret-change-me";
  return new TextEncoder().encode(secret);
}

export async function createSessionToken(payload: SessionPayload) {
  const token = await new SignJWT({ phone: payload.phone })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_TTL_SECONDS}s`)
    .sign(getSessionSecret());
  return token;
}

export async function setSessionCookie(payload: SessionPayload) {
  const token = await createSessionToken(payload);
  cookies().set({
    name: SESSION_COOKIE_NAME,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
}

export function clearSessionCookie() {
  cookies().delete(SESSION_COOKIE_NAME);
}

export async function readSessionToken() {
  const value = cookies().get(SESSION_COOKIE_NAME)?.value;
  if (!value) {
    return null;
  }

  try {
    const { payload } = await jwtVerify(value, getSessionSecret());
    if (!payload.sub || typeof payload.phone !== "string") {
      return null;
    }
    return {
      userId: payload.sub,
      phone: payload.phone,
    };
  } catch {
    return null;
  }
}

export async function getSessionUser() {
  const session = await readSessionToken();
  if (!session) {
    return null;
  }
  const user = await prisma.user.findUnique({
    where: { id: session.userId },
  });
  return user;
}

export async function requireSessionUser(redirectTo = "/auth") {
  const user = await getSessionUser();
  if (!user) {
    redirect(redirectTo);
  }
  return user;
}
