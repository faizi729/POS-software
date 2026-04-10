import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const res = NextResponse.redirect(new URL("/super-admin/login", req.url));
  res.cookies.set("sa_token", "", { httpOnly: true, path: "/", expires: new Date(0) });
  return res;
}

