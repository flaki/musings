import { html } from './minihtml.js'

const LOCAL_DATE_FORMAT = { month: 'long', year: 'numeric', day: 'numeric' }


const tPost = (post) => html`<div>
  ${post.contents}
  <p><time datetime="${new Date(post.date).toISOString()}">${new Date(post.date).toLocaleDateString(post.language, LOCAL_DATE_FORMAT)}</time></p>
</div>
`

export const templates = { tPost }
