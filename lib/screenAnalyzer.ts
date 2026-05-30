import OpenAI from 'openai'
import { ScreenAnalysis } from '@/types'

const client = new OpenAI()

export async function analyseScreenshots(
  base64Images: string[],
  mimeTypes: string[],
  appName: string
): Promise<ScreenAnalysis[]> {
  if (!base64Images.length) return []

  const imageContent: OpenAI.Chat.ChatCompletionContentPart[] = base64Images.map((b64, i) => ({
    type: 'image_url' as const,
    image_url: {
      url: `data:${mimeTypes[i] || 'image/png'};base64,${b64}`,
    },
  }))

  const prompt = `You are a senior UX researcher and mobile product designer
specialising in Indian fintech apps.

Analyse these ${base64Images.length} screenshots from ${appName}.

For each screenshot return a JSON object:
{
  "screenIndex": <0-based index>,
  "screenName": "descriptive name e.g. Recharge Home, Plan Selection, Payment Confirmation",
  "layoutDescription": "2-3 sentences describing overall layout and information hierarchy",
  "keyElements": [
    {
      "element": "element name e.g. Plan list, CTA button, Header",
      "position": "top-left | top-center | top-right | middle-left | center | middle-right | bottom-left | bottom-center | bottom-right",
      "currentState": "what it currently looks like and says",
      "potentialIssue": "specific UX problem if any, or 'none'"
    }
  ],
  "uxSmell": "one sentence: the single biggest UX problem on this screen",
  "positiveAspects": ["what works well — max 2 items"]
}

Return a JSON array with one object per screenshot.
Return ONLY valid JSON. No explanation. No markdown.`

  try {
    const response = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      max_tokens: 4096,
      messages: [{
        role: 'user',
        content: [
          ...imageContent,
          { type: 'text', text: prompt },
        ],
      }],
    })

    const text = response.choices[0].message.content?.trim() ?? '[]'
    const clean = text.replace(/```json|```/g, '').trim()
    const parsed = JSON.parse(clean) as ScreenAnalysis[]

    return parsed.map((s, i) => ({
      ...s,
      base64: base64Images[i],
    }))
  } catch (err) {
    console.error('[screenAnalyzer] failed:', err)
    return []
  }
}
