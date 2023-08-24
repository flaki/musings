import { html } from './minihtml.js'

const LOCAL_DATE_FORMAT = { month: 'long', year: 'numeric', day: 'numeric' }


export const tPost = (post) => html`
<h1 id="${post.label}" class="p-name">${{ toString() { return post.title }}}</h1>

<blockquote class="p-description">${post.description}</blockquote>

<p class="impressum">
  published:
  <time class="dt-published" datetime="${post.published.toISOString()}">${
    post.published.toLocaleDateString(post.language, LOCAL_DATE_FORMAT)
  }</time>${
    post.updated ? ', last updated: ' : ''
  }<time class="dt-updated" datetime="${post.updated?.toISOString()}">${
    post.updated?.toLocaleDateString(post.language, LOCAL_DATE_FORMAT) ?? ''
  }</time>
</p>

<div class="e-content">
  ${[ post.contents ]}
</div>
`

export default { tPost }
