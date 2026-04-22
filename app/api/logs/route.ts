import { NextResponse } from "next/server";
import { otlpPayload } from "@/lib/mock/otlpPayload";

export async function GET() {
  return NextResponse.json(otlpPayload);
}
