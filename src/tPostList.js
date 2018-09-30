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


  return html`<li>
    <h2><a href="${post.url}">${post.title}</a></h2>
    <p>${post.description}</p>
    <p><time datetime="${machineDate(publication)}">${langDate(publication)}</time>${[updated]}</p>
  </li>`
}

export default function(posts) {
  return `<ul class="posts">
    ${posts.map(p => post(p)).join('\n')}
  </ul>`
}
