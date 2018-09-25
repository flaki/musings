const encodeHtmlEntities = text => text.replace(/[<&>]/g, (c) => ['&lt;','&amp;','&gt;']['<&>'.indexOf(c)])

export const html = (parts, ...subs) => parts.map( (p,i) => p + (subs[i] ? (typeof subs[i] === 'string' ? encodeHtmlEntities(subs[i]) : subs[i]) : '' )).join('')
