setTimeout(() => {
  const dialog = document.querySelector('dialog.gallery')

  Array.from(
    document.querySelectorAll('article li>img')
  ).forEach(img => img.addEventListener('click', (e) => {
    const src = e.target.src
    const text = e.target.title || e.target.alt || ''
    const aspect = img.width/img.height
    const container = document.querySelector('.gallery div')

    container.innerHTML = ''
    container.style.background = `url('${src}') left top/contain no-repeat`
    container.insertAdjacentHTML('beforeend', `<img src="${src.replace('thumb.','')}" alt="${e.target.alt}" /><label>${text}</label>`)

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
