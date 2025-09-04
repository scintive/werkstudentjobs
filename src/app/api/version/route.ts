import { NextResponse } from 'next/server'

export async function GET() {
  const version = process.env.NEXT_BUILD_ID || 'dev'
  return NextResponse.json({
    version,
    ts: new Date().toISOString(),
    port: process.env.PORT || '3001'
  })
}

