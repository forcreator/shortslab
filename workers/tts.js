addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

async function handleRequest(request) {
  // Handle CORS preflight requests
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Accept',
        'Access-Control-Max-Age': '86400',
      }
    })
  }

  // Parse the request URL
  const url = new URL(request.url)
  const text = url.searchParams.get('text')

  if (!text) {
    return new Response('Text parameter is required', { 
      status: 400,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'text/plain'
      }
    })
  }

  // Construct Google Translate TTS URL
  const ttsUrl = new URL('https://translate.google.com/translate_tts')
  ttsUrl.searchParams.set('ie', 'UTF-8')
  ttsUrl.searchParams.set('tl', 'en-US')
  ttsUrl.searchParams.set('client', 'tw-ob')
  ttsUrl.searchParams.set('q', text)

  try {
    // Fetch from Google Translate
    const response = await fetch(ttsUrl.toString(), {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
        'Referer': 'https://translate.google.com',
        'Accept': 'audio/mpeg'
      }
    })

    if (!response.ok) {
      return new Response(`Failed to fetch audio: ${response.statusText}`, {
        status: response.status,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'text/plain'
        }
      })
    }

    // Create response with CORS headers
    const headers = new Headers()
    headers.set('Access-Control-Allow-Origin', '*')
    headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS')
    headers.set('Access-Control-Allow-Headers', 'Content-Type, Accept')
    headers.set('Cache-Control', 'public, max-age=31536000')
    headers.set('Content-Type', 'audio/mpeg')

    return new Response(response.body, {
      status: 200,
      headers
    })
  } catch (error) {
    return new Response('Error fetching audio: ' + error.message, { 
      status: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'text/plain'
      }
    })
  }
} 