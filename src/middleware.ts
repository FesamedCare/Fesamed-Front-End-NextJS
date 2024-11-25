import { isUserAuthenticated } from "@/session";
import { NextRequest, NextResponse } from "next/server";

const protectedRoutes = ["/dashboard"];
export default function middleware(req: NextRequest) {
  if (
    !isUserAuthenticated &&
    protectedRoutes.includes(req?.nextUrl?.pathname)
  ) {
    const absoluteUrl = new URL("/login", req.nextUrl.origin);
    return NextResponse.redirect(absoluteUrl.toString());
  }
  return NextResponse.next();
}