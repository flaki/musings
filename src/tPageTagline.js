export default (p) => {
  const { page } = p

  switch (page.language) {

  case 'hu':
    return `<p class="tagline">
      <a href="https://about.flak.is/" target="_blank">Flaki</a> random gondolatai a világról. Nevezhetjük tulajdonképpen "blog"-nak is.
    </p>`

  default:
  //case 'en':
    return `<p class="tagline">
      <a href="https://about.flak.is/" target="_blank">Flaki</a>'s musings about the world. You may also call this a "blog".
    </p>`

  }
}
