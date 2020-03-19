import { html } from './minihtml.js'
import { machineDate, localeDate } from './util/datefmt.js'

const l10n_updated = {
  'en': 'updated',
  'hu': 'frissült'
}

export function post(post) {
  const publication = post.published || post.date
  const langDate = localeDate.bind(null, post.language)

  const updated = post.updated ? ` (${l10n_updated[post.language]}: <time datetime="${machineDate(post.updated)}">${langDate(post.updated)}</time>)` : ''

  // Giant quick hack to avoid double-encoding html entities in `post.title`
  return html`<li>
    <h2><a href="${post.url}">${ { toString: _ => post.title } }</a></h2>
    <p>${post.description}</p>
    <p><time datetime="${machineDate(publication)}">${langDate(publication)}</time>${[updated]}</p>
  </li>`
}

export default function(posts) {
  // Sort to last-updated
  let sortedPosts = Array.from(posts)

  sortedPosts.sort( (p1,p2) => (p2.updated||p2.published)-(p1.updated||p1.published) )

  return `<ul class="posts">
    ${sortedPosts.map(p => post(p)).join('\n')}
  </ul>`
}
