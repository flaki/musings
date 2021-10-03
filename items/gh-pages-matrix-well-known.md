    social_image: gh-pages-matrix.png
    published: 2020-04-28

---

    language: en
    description: Turns out Jekyll processes your files GH pages even if you don't use or care about Jekyll at all

# TIL: Getting GitHub Pages to publish your Matrix `.well-known` config

[My files](https://github.com/flaki/flak.is) inside the `.well-known` directory never showed up in the deployed GitHub Pages site. So after some frustration and couple of unsuccessful deploys, I realized that Jekyll [still processes your files by default](https://help.github.com/en/github/working-with-github-pages/about-github-pages), even if you don't care about Jekyll or intend to use it in the first place:

> GitHub Pages will use Jekyll to build your site by default. If you want to use a static site generator other than Jekyll, disable the Jekyll build process by creating an empty file called `.nojekyll` in the root of your publishing source, then follow your static site generator's instructions to build your site locally.

I was trying to expose a `.well-known` directory that may host, among other things, [Matrix server configuration files](https://matrix.org/docs/spec/client_server/r0.6.0#well-known-uri), and managed to find the `include` [escape hatch](https://jekyllrb.com/docs/structure/) in the Jekyll docs, but if you don't use Jekyll at all, just turning it off with `.nojekyll` might be the easiest, as recommended by the docs above.

PS: `Access-Control-Allow-Origin` headers for these files should allow access for various web clients to work correctly. It looks like GitHub Pages [correctly exposes](https://stackoverflow.com/a/26417091) these headers, as of pretty recently.
