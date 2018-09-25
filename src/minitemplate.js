import { DEBUG } from './util/debug.js'

export const render = (template, dict) => template.replace(
  /\${([\w\.]+)}/ig,
  (_, ref) => {
    const path = ref.split('.')

    // Find referenced object in dictionary
    let v = dict
    const route = []
    try {
      while (path.length) {
        const key = path.shift()

        route.push(key)

        if (v[key] === undefined) DEBUG(ref, ' not found on '+route.join('>'), ' only {'+Object.keys(v).join(',')+'}')

        v = v[key]
      }
    }
    catch (err) {
      DEBUG('No route to ',ref)
      DEBUG(err, ' at ', route)

      v = ''
    }

    return v||''
})
