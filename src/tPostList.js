import { html } from './minihtml.js'

const LOCAL_DATE_FORMAT = { year: 'numeric', month: 'long', day: 'numeric' }

export function post(post) {
  const machineDate = new Date(post.date).toISOString()
  const localeDate = new Date(post.date).toLocaleDateString(post.language, LOCAL_DATE_FORMAT)

  return html`<li>
    <h2><a href="${post.url}">${post.title}</a></h2>
    <p>${post.description}</p>
    <p><time datetime="${machineDate}">${localeDate}</time></p>
  </li>`
}

export default function(posts) {
  return `<ul class="posts">
    ${posts.map(p => post(p)).join('\n')}
  </ul>`
}
