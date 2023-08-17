import htmlEntities from 'html-entities';
const { encode: E } = htmlEntities;

const buildDate = new Date().toUTCString()

export default feed

function feed(config, items) {
  items.sort((a,b) => (b.metadata.updated ?? b.metadata.published ?? '').localeCompare(
    a.metadata.updated ?? a.metadata.published ?? ''
  ))

  return `<?xml version="1.0" encoding="utf-8" ?>
  <rss version="2.0"
    xmlns:atom="http://www.w3.org/2005/Atom">
    <channel>
      <title>${E(config.sitename)}</title>
      <description>${E(config.sitedesc)}</description>
      <link>${E(config.siteroot)}/</link>
      <atom:link href="${E(new URL('/feed.xml', config.siteroot))}" rel="self" type="application/rss+xml"/>
      <pubDate>${buildDate}</pubDate>
      <lastBuildDate>${buildDate}</lastBuildDate>
      ${items.map(i => item(i)).join('\n')}
    </channel>
  </rss>`
}

function item(i) {
  let itemTitle = i.title
    .replace(/&amp;/g, '&#38;')
    .replace(/<[^>]+?>/g, '')

  return `<item>
    <title>${itemTitle}</title>
    <link>${E(i.fullUrl)}</link>
    <pubDate>${new Date(i.metadata.updated ?? i.metadata.published).toUTCString()}</pubDate>
    <guid isPermaLink="true">${E(i.fullUrl)}</guid>
    <description>
      ${E(i.description)}
    </description>
    <summary type="html"><![CDATA[${i.contents}]]></summary>
  </item>`
}
