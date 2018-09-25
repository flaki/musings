export default (p) => {
  const { page } = p

  //const langSwitch = (
  //  language === DEFAULT_LANGUAGE
  //  ? { switch_flag: '🇭🇺', switch_url: '/hu/', switch_text: 'Magyar nyelven elérhető bejegyzések' }
  //  : { switch_flag: '🇬🇧', switch_url: '/', switch_text: 'Blogposts in English' }
  //)

  switch (page.language) {

  case 'en':
    return `<p lang="hu">
      🇭🇺 <a href="/hu/">Magyar nyelven elérhető bejegyzések </a>
    </p>`

  case 'hu':
    return `<p lang="hu">
      🇬🇧 <a href="/">Blogposts in English</a>
    </p>`

  default:
    return ''

  }
}
