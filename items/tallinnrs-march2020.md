    published: 2020-03-19

---

    language: en
    description: A short recount of our first Tallinn Hack'N'Learn and some musings about online events in general

# Thoughts on online events & the first Rust Tallinn Hack'n'Learn

Like many others, [Rust Tallinn](https://tallinn.rs/) was also forced to cancel its [first ever physical event](https://tallinn.rs/events/2020-03-hacknlearn), that's already been in the making for months. [Elina](https://twitter.com/logicsoup) & I have been deliberating making the jump for some time at that point, but after days of careful consideration we have [announced](https://twitter.com/RustTallinn/status/1238119394640879616) the move to an online event format last Thursday — one day before the event.  
That same day the Estonian government [declared the state of emergency](https://estonianworld.com/life/the-estonian-government-declares-a-state-of-emergency-due-to-coronavirus/).

## International troublemaker
This wasn't the first time I needed to face the new realities of COVID-19's global rampage and its devastating effects on (among all else) international tech communities. One by one conferences I was booked for were cancelling or postponing: some on their own organizers' volition, some forced by their governments' measures trying to combat the virus's spread. Our very own RustFest has been in a limbo for weeks, with the team trying to decide whether or not to go ahead with the event in the first place.

We have been working on making RustFest as inclusive and accessible as possible for four years now, with ever-increasing determination. I believe being a community and not-for-profit event helped us choose the right North Star for our endeavour, and kept us on the correct path these years: RustFest is a "from the community, for the community"-kind of event — many call these "labour of love conferences", and they are not wrong. This is why we (and I, personally) have always wanted to push the envelope, to not be complacent with the status quo, to want to do better and not just do things in certain ways only because *"well that's how these things have always been done"*.  
This is what drove us in our decision to re-schedule and re-imagine RustFest — and this was also how we set out to revamp Rust Tallinn's debut…

## Remote-friendliness in events
I strongly believe that any event can benefit from considerations of remote-friendliness, even those events that do not make enabling remote attendance a primary concern. Having a live stream (to which we have only committed to in the past in a "best effort" fashion at RustFest) has shown us many unexpected positive consequences! Beyond making the conference accessible to those who cannot afford the tickets (even despite extensive discounts, giveaways and a scholarship program), or the travel to the event, we have seen other, less straightforward ways that a live stream helped out someone. We had our very speakers join in on our live stream from their hotel rooms, while practicing their upcoming talk or trying their best to recover from illness quickly enough to be able to present their talks that didn't want to cancel.

Of course, simply offering a live stream is hardly the pinnacle of remote conference experiences, there are many more things one can try and experiment with to enrich these experiences — and at the same time, "just" having a live stream can in itself be daunting: it absolutely is additional work that needs time, effort, resources and infrastructure, one or several of which might be not available to the organizers and so it's also perfectly fine not even trying to tackle these issues. Yet for those of you who decide to do so anyway, I would still like to encourage you: try new ideas and try to innovate, pushing beyond already commonplace and established practices.

## Our first online Hack'n'Learn
The first Rust Tallinn meetup was planned to take place as a "Hack'n'Learn", and this was both a curse & a blessing when we decided to switch to an online format.

On one hand, talk-style meetups would be considerably more straightforward to transition online: the speakers turn on their web camera, share their slides, talk for 20 minutes, maybe answer some questions — repeat three times, an hour and a half later it's all done & everyone ~~goes home~~ is already home. Hack'n'Learn-s are freeform events where people get together and hack on their own things, occasionally getting help, mentoring or just hanging out and chatting with the other attendees. Working out how to transplant this format onto an online setting was definitely more challenging than a conventional talk-style meetup event.

On the other hand we need not to worry about the technology collapsing on us and the regular issues plaguing online talk-streaming scenarios (internet going down, voice being too quiet or choppy, delayed or non-visible slides etc.).

## Choosing an accessible baseline
Text is one of the most inclusive forms of human digital communication: it's inherently more accessible than e.g. voice, disabled people can use a variety of accessibility tools such as screen readers to interact with it, one can use automatic translation tools to make sense of more complex conversations (especially important for English-as-a-second-language speakers). This was one of the main reasons why we chose a chat app as our baseline for the online event: we decided that the event will take place primarily in a dedicated [Matrix](https://matrix.org/) channel.

Our budding community already had a Matrix channel for casual conversation, so it made sense for us to choose the same service, but separate out the meetup from the casual banter of the public channel. This also made sure that our public channel stayed accessible to anyone, but people who would show up in the meetup channel will surely have explicitly agreed to our [Code of Conduct](https://tallinn.rs/policies/code-of-conduct/), as part of their registration for the event (and Matrix provided us tools for moderation should it be necessary to enforce the CoC during the event).

We initially chose Matrix for the openness of the platform and the values they represent, but any sufficiently accessible chat platform should work for your communities, and perhaps some are even better suited to certain regions.

## Progressive enhancement for your online event
Unfortunately text is also one of the lowest-bandwidth communication methods, and besides speed, it also often lacks nuance. For this reason, it is important to think of ways to progressively enhance your online event — to provide more casual and more higher-bandwidth forms of communications, when possible.

We have decided to have a parallel audio & video chat open during the meetup (we used [Zoom](http://zoom.us/) for this purpose). This channel was an informal "hangout" to ask questions and discuss things. We were also careful to stress that this was an optional extension to the experience, not everybody needed to be present there, and whenever Elina made a quick opening or closing announcement, I was taking notes and transcribing it in our Matrix channel so people don't miss anything important. Similarly, the gist of conversations and useful tidbits coming out of the voice chat were re-shared in the text chat as well.

## The icing on the cake, add some sprinkles
The voice chat was expected to enhance the "productivity" aspect of the meetup, but there are innumerable other ways one could improve other aspects, or simply the "fun factor" of these online events. Unfortunately, due to the shortness of time, we only got to implement one of our ideas for the last meetup but we are already thinking of other ways of enhancing people's experience (especially around making it easier to meet & get to know others).

For the Hack'n'Learn we planned — like many other meetups do — to provide food. We were thinking on a more varied cuisine for upcoming events, but for the first event we settled on pizzas (with vegetarian, vegan and gluten free options). When the disaster struck we were already thinking of solving the (surprisingly hard!) problem of hygienic pizza-distribution at the meetup, and so even upon having to cancel the physical event we still didn't want to give up bringing people together around a nice meal. This was when the idea came to, instead of ordering food to the meetup space, let people *order their own*, and have it delivered straight to them.

We ended up spending the funds we allocated for catering on [Wolt](https://wolt.com/) coupons, and every registered attendee was welcome to order from the food delivery service whatever they liked. Now obviously the experience is not the *same* as physically sharing a meal with your fellow Rustaceans, but it ended up being a comparable gesture and people enjoyed it. Also not only that these people got to enjoy the food they preferred, from the coziness of their homes, but for anyone who ever organized a meetup and ended up with 5 giant cold pizzas afterwards the reduction in leftovers & food waste will come off as a commendable advantage.

## What's next?
As I mentioned above the shortness of time didn't allow for realization of many of our other ideas. We have plans to experiment with different ideas and event formats in the future.

We want to expand our infrastructure, working continuously on improving our website to completely break free of silos like Meetup dot com or Facebook, and want to take advantage of Matrix's openness to build more automation and integration into our chat as well. As part of that we are planning to launch our own Matrix host, in collaboration with Bay Area Tech Club.

We have created [Bay Area Tech Club](https://opencollective.com/baytech), an Estonian non-profit association to help tech communities in the Baltic connect and thrive. Rust Tallinn is one of the first communities under the umbrella of *BayTech*, and we are welcoming other local tech communities who need support, please drop us an email at contact (at) baytech.community!  
If you are a tech company who would be interested in supporting our cause, please do reach out also, all help is welcome.

The same goes for Rust Tallinn, if you have ideas what kind of future events would be useful, or want to be part of the organizing team helping us bringing Estonian Rustaceans together, create events and re-imagine online event experiences, please drop us a mail at rust (at) baytech.community.
