import { NextRequest, NextResponse } from 'next/server'
import { analyseScreenshots } from '@/lib/screenAnalyzer'

export const maxDuration = 60

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const appName = formData.get('appName') as string
    const files = formData.getAll('screenshots') as File[]

    if (!files.length) {
      return NextResponse.json({ analyses: [] })
    }

    const base64Images: string[] = []
    const mimeTypes: string[] = []

    for (const file of files.slice(0, 10)) {
      const buffer = await file.arrayBuffer()
      const b64 = Buffer.from(buffer).toString('base64')
      base64Images.push(b64)
      mimeTypes.push(file.type || 'image/png')
    }

    const analyses = await analyseScreenshots(base64Images, mimeTypes, appName)
    return NextResponse.json({ analyses })
  } catch (err) {
    console.error('[api/analyse-screens]', err)
    return NextResponse.json({ error: 'Screen analysis failed' }, { status: 500 })
  }
}
