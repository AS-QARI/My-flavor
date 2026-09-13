import { identity, json, failure } from '@/lib/api';
import { googleMapsURL, parseGooglePlace } from '@/lib/google-maps';

export async function POST(request: Request) {
  try {
    await identity(request, true);
    const body = await request.text();
    if (body.length > 5000) return json({ error: 'الرابط طويل جدًا.' }, 400);
    let input: unknown;
    try {
      input = JSON.parse(body).url;
    } catch {
      return json({ error: 'تعذّر قراءة الرابط.' }, 400);
    }
    let url = typeof input === 'string' ? googleMapsURL(input.trim()) : null;
    if (!url)
      return json({ error: 'استخدم رابط مشاركة من قوقل ماب فقط.' }, 400);
    for (let hop = 0; hop < 6; hop++) {
      const place = parseGooglePlace(url.href);
      if (place.position) return json(place);
      if (url.hostname !== 'maps.app.goo.gl' && url.hostname !== 'goo.gl')
        break;
      const response = await fetch(url.href, {
        redirect: 'manual',
        signal: AbortSignal.timeout(8000),
      });
      await response.body?.cancel();
      const location = response.headers.get('location');
      if (!location || response.status < 300 || response.status >= 400) break;
      // Validate every hop before fetching; never follow arbitrary redirects.
      url = googleMapsURL(new URL(location, url).href);
      if (!url)
        return json(
          { error: 'الرابط يحوّلك خارج قوقل ماب. استخدم رابط المكان مباشرة.' },
          400,
        );
    }
    return json(
      {
        error:
          'الرابط لا يحتوي موقعًا دقيقًا يمكن قراءته. افتح المكان في قوقل ماب وانسخ رابط مشاركته، أو حدد الدبوس على الخريطة.',
      },
      422,
    );
  } catch (error) {
    if (error instanceof Response) return error;
    if (
      error instanceof Error &&
      ['TimeoutError', 'TypeError'].includes(error.name)
    )
      return json(
        {
          error:
            'تعذّر فتح رابط قوقل الآن. حاول مجددًا أو حدد الموقع على الخريطة.',
        },
        502,
      );
    return failure(error);
  }
}
