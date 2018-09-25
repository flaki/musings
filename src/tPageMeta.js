export default function(p) {
  const { global, page, content } = p

  return `
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">

<title>${page.title||global.sitename}</title>

<meta name="description" content="${page.description}" />
<meta name="keywords" content="${page.keywords}" />

<!-- Social: Twitter -->
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:site" content="@slsoftworks" />

<meta name="twitter:title" content="${page.title}" />
<meta name="twitter:description" content="${page.description}" />
<meta name="twitter:image:src" content="${page.socialImage||global.socialImage}" />

<!-- Social: Facebook / Open Graph -->
<meta property="og:site_name" content="${global.sitename}" />
<meta property="og:type" content="website" />
<meta property="og:url" content="${page.fullUrl}" />

<meta property="og:title" content="${page.title}" />
<meta property="og:description" content="${page.description}" />
<meta property="og:image" content="${page.socialImage||global.socialImage}" />
`
}
