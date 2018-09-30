export const LOCAL_DATE_FORMAT = { year: 'numeric', month: 'long', day: 'numeric' }


export function machineDate(d) {
  return new Date(d).toISOString()
}

export function localeDate(locale, d) {
  return new Date(d).toLocaleDateString(locale, LOCAL_DATE_FORMAT)
}
