# Opt-Out Is Not Ownership

**The industry spent a year arguing about a checkbox. The argument was lost the moment we accepted that a checkbox was the thing worth arguing about.**

---

In February, a screenshot went around of proposed Community Notes about AI training data. It named Suede Labs as an opt-out option. The capture recorded 2.7 million views. I want to be precise about what that was: it was the note's wording, not an endorsement of anything I've built. Nobody handed me a prize.

But I've thought about that screenshot more than almost anything else that happened this year, because of the shape of the sentence it put me in. *Here is a way to opt out.* That was the good news. That was the creator-friendly framing.

Read it again. It's a ransom note with better manners.

Opting out is a request to be excluded from something you never agreed to join, made to a party that already has your work, on terms they wrote, enforced by nobody. It is not a right. It is a courtesy, and courtesies get withdrawn when they get expensive.

## What the checkbox actually concedes

Every opt-out regime shares a hidden premise: that the default is ingestion, and your work is in the pile unless you do paperwork. The burden runs the wrong direction. You are the one who has to find the form, per platform, per model, per crawler, forever, and you have to do it again every time a new company spins up, and you have to do it in a format each of them invented last Tuesday.

Meanwhile the thing you actually own — the fact that you made this, on this date, in this form, and here are the terms on which someone may use it — has no address. It lives in your head, in a contract PDF, maybe in a copyright registration that took months and covers a snapshot. It does not exist anywhere a machine can read it.

That asymmetry is the whole game. The ingestion side is fully automated. The consent side is a web form.

So the fight over opt-out isn't a fight creators are losing. It's a fight creators already lost by agreeing to have it. You cannot win a negotiation where your only move is "please don't."

## The affirmative version

The opposite of opting out is not opting in harder. It's making your work arrive with its terms attached, machine-readable, priced, and payable — so that using it correctly is *easier* than scraping it.

That sounds utopian until you break it into parts that already exist:

**Proof of creation.** A dated, signed record that a specific file existed in a specific form, claimed by a specific wallet, on a specific date. That's what the [Suede IP Registry](https://ip.suedeai.ai) does — wallet-signed claims, file fingerprints, public timestamps on Base and Avalanche. I'm careful about what this is: it's evidence, not legal title. It does not make you the author. It makes it very hard for anyone to claim you weren't, later, after the fact, when it matters.

**Rights metadata that travels.** Not a terms-of-service page a crawler ignores. A structured record — what this is, who made it, what you may do with it, what it costs, who gets paid — that sits with the work and can be read without a human in the loop. [Suede Lens](https://suedeai.ai/lens) audits any page for exactly these signals, because most sites currently emit none of them, including sites run by people who would tell you passionately that their rights matter.

**A way to actually pay.** This is the part everyone skips, and it's the part that makes the rest real. x402 is an HTTP-native payment rail: a request arrives, the server answers *402 Payment Required* with machine-readable terms, the client pays, the request completes. Our [x402 manifest](https://app.suedeai.ai/.well-known/x402.json) is a public catalog of what's for sale and what it costs. An agent can read it, decide, and buy, with no salesperson, no contract cycle, no email.

Put those three together and the posture inverts. You're no longer asking not to be taken from. You're running a storefront that machines can shop at.

## Why "just pay creators" hasn't happened yet

The usual answer is that AI companies are greedy. That's too easy, and it's also not the binding constraint.

The binding constraint is that for most work on the internet, *there is no one to pay and no way to pay them.* The rights are unclear, the owner is unlisted, the price is unstated, and the payment mechanism assumes a human with a credit card and a signature. If you're building a system that needs a hundred thousand licensed assets, "negotiate each one" is not a plan, it's a reason to scrape instead.

I don't say that to excuse anyone. I say it because it identifies the actual work. Moral pressure has had two years and produced a checkbox. Infrastructure has a better track record than persuasion.

The web didn't get commerce because merchants shamed browsers into it. It got commerce because somebody shipped a payment flow that worked over HTTP, and then buying became the path of least resistance.

## The part where I'm arguing against my own interest

Here's the uncomfortable version, for creators who agree with everything above.

Most people reading this have no proof of creation for anything they've made. No fingerprint, no timestamp, no signed claim. Their rights terms, if they exist, are prose on an About page. Their price for commercial use is "email me." They have been furious about AI training for two years and have not spent twenty minutes making a single machine-readable statement about a single piece of their work.

I include a version of my past self in that. The registry exists because I needed it and it wasn't there.

None of this requires my tools. The fingerprint is a hash. The timestamp can go on any chain or any notarization service. The rights terms can be JSON-LD you write by hand, once, and reuse. The price can be a number in a file at a well-known path. I'd rather you use Suede, obviously. I'd much rather you do it somewhere than be right about it nowhere.

Because the next phase isn't people reading your work. It's agents. An agent doesn't browse, get moved, and remember your name. It resolves a query, and it takes the path that resolves. If your terms aren't machine-readable, an agent will not infer them out of respect. It will treat silence as permission, or it will route around you to someone whose terms it could read — and in the second case you didn't get exploited, you just got skipped, which pays exactly the same.

## What I'd actually do this week

Not a product pitch. A sequence.

1. **Pick one piece of work that matters to you.** Not your catalog. One song, one essay, one photo set.
2. **Hash it.** `shasum -a 256 the-file`. Write the hash down somewhere dated and public — a commit, a post, a registry entry, a notarized record. You now have a thing you did not have yesterday: a defensible claim about when this file existed.
3. **Write the terms in one paragraph.** Who made it, what's allowed, what's not, what commercial use costs, who to pay. Plain language first.
4. **Make it machine-readable.** JSON-LD on the page, or a file at a stable path. It does not have to be a standard anybody has blessed. It has to be parseable and it has to be at an address.
5. **State a price.** This is the step people skip and it's the one that changes your position. "Contact for licensing" is not a price. It's a wall, and walls get walked around. A number is an offer, and an offer can be accepted by a machine at three in the morning.

That's it. No lawyers, no blockchain religion, no permission from a platform.

## The line I keep coming back to

Opt-out asks a question: *will you please leave my work alone?*

Ownership makes a statement: *this is mine, here is proof, here are the terms, here is the price, and here is the endpoint that takes payment.*

One of those is a request that can be denied. The other is infrastructure that has to be routed around — and routing around it costs more than paying.

The AI companies are not going to build the second one for you. Why would they? It is not their job and it is against their interest, and every hour that creators spend fighting over the wording of the first one is an hour nobody spends building the second.

The screenshot said there was a way to opt out. I'd like the next screenshot to say there was a way to get paid.

---

*Jason Colapietro is the founder and CEO of [Suede Labs AI](https://suedeai.ai), which builds creator ownership infrastructure: proof of creation, provenance, rights metadata, licensing, royalty routing, and agent commerce. He publishes music, video, and writing as Johnny Suede. The public record is at [jasoncolapietro.com](https://jasoncolapietro.com); the receipts behind the claims above are at [seo.suedeai.ai/evidence](https://seo.suedeai.ai/evidence).*
