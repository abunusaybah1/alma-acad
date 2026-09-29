import Link from "next/link";
import { FiArrowRightCircle } from "react-icons/fi";

export default function LandingPage() {
  return (
    <div className="overflow-hidden">
      <section className="relative border-b border-border">
        <div className="max-w-6xl mx-auto px-6 py-24 lg:py-28 grid lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-7">
            <div className="inline-flex items-center gap-2 text-sm font-mono text-accent mb-5 px-3 py-1 rounded-full border border-accent">
              Almattech Academy
            </div>
            <h1
              className="text-5xl lg:text-6xl font-semibold text-foreground leading-[1.05] tracking-tight"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Learn to build,
              <br />
              not just to code.
            </h1>
            <p className="text-gray-500 mt-6 text-lg max-w-md leading-relaxed">
              I built this because most courses stop at &quot;here&apos;s how
              this tool works&quot; and leave you stuck the moment you try to
              build something real. At Almattech Academy, each module ends with
              an actual project, reviewed by an actual mentor... the method I
              wish I was taught.
            </p>
            <div className="flex items-center gap-4 mt-9">
              <Link
                href="/courses"
                className="bg-accent hover:bg-accent-hover text-white px-7 py-3.5 rounded-md transition-colors font-medium"
              >
                Browse Courses
              </Link>
              <a
                href="#how-it-works"
                className="underline text-foreground hover:text-accent px-2 py-3.5 font-medium transition-colors flex gap-2 items-center"
              >
                See how it works <FiArrowRightCircle />
              </a>
            </div>
          </div>

          <div className="relative lg:col-span-5 lg:-mr-10 animate-fade-up [animation-delay:150ms]">
            <div className="absolute -inset-6 bg-accent/20 blur-3xl rounded-full opacity-60" />

            <div
              className="relative rounded-xl overflow-hidden rotate-2 hover:rotate-0 transition-transform duration-500"
              style={{ boxShadow: "8px 8px 0 var(--color-accent)" }}
            >
              <div className="bg-ink px-4 py-3 flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-red-400" />
                <span className="w-3 h-3 rounded-full bg-yellow-400" />
                <span className="w-3 h-3 rounded-full bg-accent" />
                <span className="text-xs text-gray-400 ml-2 font-mono">
                  curriculum.ts
                </span>
              </div>
              <pre className="bg-ink text-gray-200 font-mono text-sm p-6 overflow-x-auto leading-relaxed">
                {`const you = learner()

you
  .learn('html', 'css', 'js')
  .learn('react')
  .learn('nextjs', 'supabase')
  .ship('real projects')
  .mentor('other builders')`}
              </pre>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-accent-light py-24">
        <div className="max-w-6xl mx-auto px-6">
          <h2
            className="text-3xl lg:text-4xl font-semibold text-foreground mb-4"
            style={{ fontFamily: "var(--font-display)" }}
          >
            All modules, in the order that actually makes sense.
          </h2>
          <p className="text-gray-600 max-w-xl mb-14">
            This is not a random playlist of videos. Each module builds on the
            one before it, so by the time you start building real projects,
            you&apos;re not guessing. Rather, you already know why every piece
            fits.
          </p>

          <div className="flex flex-wrap gap-4">
            {[
              {
                n: "01",
                title: "Enroll",
                desc: "Pick the track that matches where you actually are, not where you wish you were.",
              },
              {
                n: "02",
                title: "Learn at your pace",
                desc: "Video and text lessons you can revisit as many times as you need — there's no clock running.",
              },
              {
                n: "03",
                title: "Submit real work",
                desc: "Push a real project. A mentor actually looks at it and tells you what to fix and why.",
              },
              {
                n: "04",
                title: "Ship",
                desc: "Walk away with something in your portfolio you built yourself, not something you copied from a tutorial.",
              },
            ].map((step) => (
              <div
                key={step.n}
                className="basis-full md:basis-[calc(50%-0.5rem)] lg:basis-[calc(25%-0.75rem)] grow bg-background p-6 rounded-lg border border-border hover:bg-accent-light/60 transition-colors"
              >
                <span className="font-mono text-accent text-sm">{step.n}</span>
                <h3 className="font-semibold text-foreground mt-2 mb-1.5">
                  {step.title}
                </h3>
                <p className="text-sm text-gray-500 leading-relaxed">
                  {step.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="relative bg-ink py-28 overflow-hidden">
        <span
          className="absolute -top-4 left-6 text-[220px] leading-none font-mono text-white/4 select-none pointer-events-none"
          aria-hidden
        >
          $
        </span>

        <div className="relative max-w-3xl mx-auto px-6 text-center">
          <h2
            className="text-3xl lg:text-5xl font-semibold text-white leading-[1.15] tracking-tight"
            style={{ fontFamily: "var(--font-display)" }}
          >
            I started learning to code on a phone. I know exactly which parts of
            this are confusing, because I sat with the confusion myself.
          </h2>
          <p className="text-gray-400 mt-7 text-lg leading-relaxed max-w-xl mx-auto">
            That&apos;s the whole philosophy here... Nothing is explained the
            way a textbook explains it. It&apos;s explained the way I wish
            someone had explained it to me, back when I had no laptop, no
            mentor, and no idea what I was doing.
          </p>
        </div>
      </section>

      <section id="how-it-works" className="bg-mist py-24">
        <div className="max-w-6xl mx-auto px-6">
          <h2
            className="text-3xl lg:text-4xl font-semibold text-foreground mb-4"
            style={{ fontFamily: "var(--font-display)" }}
          >
            From enrollment to projects you&apos;re actually proud of...
          </h2>
          <p className="text-gray-600 max-w-xl mb-14">
            No cohorts to wait for, no deadlines you&apos;ll miss because life
            happened. Just a clear next step, every time you finish one.
          </p>

          <div className="flex flex-wrap gap-4">
            {[
              {
                n: "01",
                title: "Enroll",
                desc: "Pick the track that matches where you actually are, not where you wish you were.",
              },
              {
                n: "02",
                title: "Learn at your pace",
                desc: "Video and text lessons you can revisit as many times as you need — there's no clock running.",
              },
              {
                n: "03",
                title: "Submit real work",
                desc: "Push a real project. A mentor actually looks at it and tells you what to fix and why.",
              },
              {
                n: "04",
                title: "Ship",
                desc: "Walk away with something in your portfolio you built yourself, not something you copied from a tutorial.",
              },
            ].map((step) => (
              <div
                key={step.n}
                className="basis-full md:basis-[calc(50%-0.5rem)] lg:basis-[calc(25%-0.75rem)] grow bg-background p-6 rounded-lg border border-border hover:bg-accent-light/60 transition-colors"
              >
                <span className="font-mono text-accent text-sm">{step.n}</span>
                <h3 className="font-semibold text-foreground mt-2 mb-1.5">
                  {step.title}
                </h3>
                <p className="text-sm text-gray-500 leading-relaxed">
                  {step.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24">
        <div className="max-w-4xl mx-auto px-6">
          <div
            className="relative rounded-lg bg-ink px-10 py-16 text-center border-2 border-ink"
            style={{ boxShadow: "10px 10px 0 var(--color-accent)" }}
          >
            <h2
              className="text-3xl lg:text-4xl font-semibold text-white mb-7"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Let me tell you something...
            </h2>
            <p className=" text-white/80 mb-7">
              Your first project is closer than you think, and it&apos;s going
              to be closer than you expect.
            </p>

            <p className="text-white/80 mb-7 mx-auto">
              I built this because I wish I had a course like this when I was
              learning to code. It would have saved me years of confusion and
              frustration. I want to give you that same advantage.
            </p>
            <Link
              href="/courses"
              className="bg-accent hover:bg-accent-hover text-white px-8 py-3.5 rounded-md transition-colors font-medium inline-block"
            >
              Browse Courses
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
