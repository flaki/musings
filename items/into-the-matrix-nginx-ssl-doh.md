    social_image: intothematrix-social.png
    published: 2020-05-14

---

    language: en
    description: "It shouldn't be too hard…" is the bane of my existence, but I wanted to bend matrix.to to my will, and (eventually) I did.

# (Back) into the Matrix — patching matrix.to and hijacking HTTPS for fun & profit

Couple days ago I came across the [Matrix Open Tech Meetup](https://matrix.org/open-tech-meetup/), an online event on open source technologies. As I clicked through to the ["Join the live chat now!"](https://matrix.to/#/!AnacGSwlCZcUuAfcEU:matrix.org?via=matrix.org&via=bpulse.org&via=uhoreg.ca) link I was reminded that I recently waved good bye to my `:matrix.org` account and moved into my own dedicated Matrix server with its own custom, *secret* Riot Web instance. And that, of course, wasn't listed in the client options...


## Matrix.into();
`matrix.to` was created 4 years ago and seldom changed ever since. Intended as a "[temporary workaround](https://twitter.com/ThePracticalDev/status/715933643387052032)" until a more robust, specialized URL scheme could be standardized.

![Rocky beginnings - screenshot of the first commits](/img/vaguely.png)

No matter whether it was built to last or not (we'll get back to this later), four years later `matrix.to` is as "ubiquitous" as one can get in terms of platformwide support, and so it happened that I thought to myself:

> "It shouldn't be *too hard* to hijack it and run my own custom instance!"

The complete source is of course [available online](https://github.com/matrix-org/matrix.to), checking it out and adding my own instance was a trivial change. I'm running linux, so quick change in `/etc/hosts` to redirect `matrix.to` into the loopback address (127.0.0.1), I thought, should ensure the browser hits up my own machine when it tries to access matrix.to, instead of the actual host on the internet. A bit more configuration in my personal `nginx` server to serve the correct files for the incoming request and...

You guessed it. It's 2020, so most services are running on the more secure [HTTPS stack](https://en.wikipedia.org/wiki/HTTPS), instead of plain-ole (and plaintext) HTTP. As you might imagine, the swift adjustment of `nginx` to bind to the SSL ports and serve a self-signed certificate was just the beginning of my struggles...


## Trudging waist-deep in HTTPS — Firefox working overtime to save me from myself

Normally at this point, if you correctly set up Nginx [to serve the pages over SSL](https://www.digitalocean.com/community/tutorials/how-to-create-a-self-signed-ssl-certificate-for-nginx-in-ubuntu-16-04) using a [self-signed certificate](https://en.wikipedia.org/wiki/Self-signed_certificate) your browser would briefly complain that "the page you are visiting is insecure", you'd add an exception and that was it, you may enjoy the fruits born by your work.

Not me, though, and it took me a while to realize that was because of DoH. DNS-over-HTTPS is a new technology that completely side-steps the operating system for resolving domain names into IP addresses to improve user privacy. The Mozilla Hacks blog has an detailed [explanation](https://hacks.mozilla.org/2018/05/a-cartoon-intro-to-dns-over-https/) on how and why is that so, but if you are using DoH in your browser you will have to figure out how to add an exception for this particular domain. In Firefox you need to use `about:config` and add matrix.to to the [`network.trr.excluded-domains` list](https://wiki.mozilla.org/Trusted_Recursive_Resolver#network.trr.excluded-domains).

Oh that's not all: through HSTS—Strict Transport Security—a site may ask the browser *never* to let you access the site via insecure connection. And self-signed certificates are exactly those. HSTS means well, it really does, but if you forget to clear `matrix.to`'s site data before you make the switch, you will be greeted with a similar unwaveringly stoic message:

![Firefox informs me that HSTS in affect, and thus I can't add a ](/img/firefox-hsts.jpg)

Of course one could choose to simply add a new trusted CA to their browser's certificate store... okay let's not make this blogpost a complete security-anti-pattern galore, let's talk a bit about client-side JavaScript for a change.


## I get a `matrix.to`, you get a `matrix.to`…
At the end of the day for our struggles we are rewarded with our own `matrix.to` instance opening whenever *any site* on the internet (on this particular machine) sends us to a matrix.to link. Great! But wouldn't it be best if _everyone_ could just set their own server and not rely on nasty hacks like these? Absolutely. So let's see if we can make that happen...

![My local matrix.to server hijacking the global one in the browser](/img/matrix-to-custom.jpg)

## Customizable AND privacy-preserving: choose two

Matrix.to was created with the user privacy in mind, so the page valiantly informs us:

> The service preserves user privacy by not sharing any information about the links being followed with the Matrix.to server - the redirection is calculated entirely clientside using JavaScript.

This also alludes to the (intentional) simplicity of `matrix.to` — it is entirely static, with no server-side component. The whole site is written in JavaScript... and React. Good-ole, [four-year-old](https://reactjs.org/blog/2016/04/07/react-v15.html) React, to be precise...

Now the idea was simple: allow the user to set a "custom" Riot Web URL (many custom Matrix hosts come with their own private Riot Web instances), the browser should save this into the browser's `localStorage`, and so this information would be preserved, yet never leave the user's computer, and it would be restored upon every future site load to be instantly available. No server-side components, no leaking of private server details. And, indeed, the concept was simple enough and most of the [time](https://twitter.com/slsoftworks/status/1260903990931394560) I actually spent on figuring out how to get [Uncle React to do my bidding](https://reactjs.org/docs/react-without-es6.html) (as, in hopes of uplifting these changes, a React version upgrade was completely out of the question).

![Screenshot of Matrix.to with the ability to set custom Riot server URLs](/img/matrix-custom-riot.png)

You can check the custom instance at [`intothematrix.flak.is`](https://intothematrix.flak.is), the [source](https://github.com/flaki/matrix.to/tree/custom-riot) of the fork is online too—maybe I'll try to get it upstreamed to `matrix.to` proper. Never know how long will this *temporary workaround* may be staying with us anyway…


> PS: Given that matrix.to happens to be a purely client-side site built with JavaScript and React, patching it up could *also* take place entirely on the client side, simply by running the appropriate script in the loaded context of the website, leaving the original site where it is, just patching *its behavior*. This could easily be accomplished automatically [using a custom Web Extension](https://developer.mozilla.org/en-US/docs/Glossary/WebExtensions), the implementation details of which I would be keen to leave as an extra-curricular activity to you, Dear Reader. :)
