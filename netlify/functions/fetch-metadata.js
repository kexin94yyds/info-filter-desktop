// Netlify Function: Fetch page metadata (title, image)
// Mirrors the logic used in the desktop Electron app.

const fetch = require('node-fetch');
const cheerio = require('cheerio');

exports.handler = async (event) => {
  const url = (event.queryStringParameters && event.queryStringParameters.url) || '';

  if (!url || !/^https?:\/\//i.test(url)) {
    return jsonResponse({ title: '', image: '' });
  }

  try {
    const metadata = await fetchMetadata(url);
    return jsonResponse(metadata);
  } catch (err) {
    console.error('Netlify fetch-metadata error:', err);
    return jsonResponse({ title: '', image: '' });
  }
};

async function fetchMetadata(url) {
  // Special handling for Twitter/X to improve success rate
  if (url.includes('twitter.com') || url.includes('x.com')) {
    return await fetchWithUserAgent(
      url,
      'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)'
    );
  }

  // Default desktop-like behaviour
  return await fetchWithUserAgent(
    url,
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.114 Safari/537.36'
  );
}

async function fetchWithUserAgent(url, userAgent) {
  const res = await fetch(url, {
    headers: {
      'User-Agent': userAgent
    },
    timeout: 8000
  });

  const html = await res.text();
  const $ = cheerio.load(html);

  const title =
    $('meta[property="og:title"]').attr('content') ||
    $('meta[name="twitter:title"]').attr('content') ||
    $('title').text() ||
    '';

  const image =
    $('meta[property="og:image"]').attr('content') ||
    $('meta[name="twitter:image"]').attr('content') ||
    '';

  return { title: title.trim(), image };
}

function jsonResponse(payload) {
  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      // Allow calling from any origin hosting this static bundle.
      'Access-Control-Allow-Origin': '*'
    },
    body: JSON.stringify(payload)
  };
}

