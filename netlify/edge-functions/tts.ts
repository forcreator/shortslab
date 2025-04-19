import { Context } from '@netlify/edge-functions';

export default async (request: Request, context: Context) => {
  const url = new URL(request.url);
  const text = url.searchParams.get('text') || '';
  
  const ttsUrl = new URL('https://translate.google.com/translate_tts');
  ttsUrl.searchParams.set('ie', 'UTF-8');
  ttsUrl.searchParams.set('tl', 'en-US');
  ttsUrl.searchParams.set('client', 'tw-ob');
  ttsUrl.searchParams.set('q', text);

  const response = await fetch(ttsUrl.toString(), {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
      'Referer': 'https://translate.google.com'
    }
  });

  const headers = new Headers(response.headers);
  headers.set('Access-Control-Allow-Origin', '*');
  headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
  headers.set('Access-Control-Allow-Headers', '*');

  return new Response(response.body, {
    status: response.status,
    headers
  });
}; 