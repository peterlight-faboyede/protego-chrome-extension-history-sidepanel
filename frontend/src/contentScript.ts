interface PageMetrics {
  url: string;
  title: string | null;
  description: string | null;
  link_count: number;
  word_count: number;
  image_count: number;
}

function isDomReady(): boolean {
  return document.readyState === 'complete' && document.body !== null;
}

async function waitForDomReady(maxRetries = 5, delay = 200): Promise<void> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    if (isDomReady()) {
      return;
    }
    await new Promise(resolve => setTimeout(resolve, delay));
  }
}

async function collectPageMetrics(): Promise<PageMetrics> {
  await waitForDomReady();
  const url = window.location.href;
  const links = document.querySelectorAll('a');
  const images = document.querySelectorAll('img');
  
  const title = document.title || null;
  
  const metaDescription = document.querySelector('meta[name="description"]');
  const description = metaDescription ? metaDescription.getAttribute('content') : null;
  
  const bodyText = document.body?.innerText || '';
  const words = bodyText.trim().split(/\s+/).filter(word => word.length > 0);
  
  return {
    url,
    title,
    description,
    link_count: links.length,
    word_count: words.length,
    image_count: images.length,
  };
}

// async function sendMetricsToBackground() {
//   const metrics = await collectPageMetrics();
//   chrome.runtime.sendMessage({
//     type: 'PAGE_METRICS',
//     data: metrics,
//   });
// }

// function waitForPageLoad() {
//   if (document.readyState === 'complete') {
//     sendMetricsToBackground();
//   } else {
//     window.addEventListener('load', sendMetricsToBackground, { once: true });
//   }
// }
//
// waitForPageLoad();

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === 'GET_METRICS') {
    collectPageMetrics().then(metrics => {
      sendResponse(metrics);
    });
    return true;
  }
  return true;
});

