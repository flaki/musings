setTimeout(() => {
  const dialog = document.querySelector('dialog.gallery')

  Array.from(
    document.querySelectorAll('article li>img')
  ).forEach(img => img.addEventListener('click', (e) => {
    const src = e.target.src
    const alt = e.target.alt
    const aspect = img.width/img.height
    const container = document.querySelector('.gallery div')

    container.innerHTML = ''
    container.insertAdjacentHTML('beforeend', `<img src="${src}" alt="${alt.replace(/\"/g,'&quot;')}" /><label>${alt}</label>`)

    let cw = aspect < 1 ? `${aspect * 90}vmin` : `90vmin`
    let ch = aspect < 1 ? `90vmin` : `${90 / aspect}vmin`
    container.style.width = cw
    container.style.height = ch

    dialog.showModal()
  }))

  document.querySelector('dialog.gallery button.close').onclick = function() {
    dialog.close()
  }
  /* polyfill */
  dialogPolyfill.registerDialog(dialog)
}, 0)
