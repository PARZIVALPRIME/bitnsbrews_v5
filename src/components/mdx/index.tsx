import type { ComponentPropsWithoutRef, ReactNode } from "react";

// ── MDX component map ────────────────────────────────────────────────────────
// Styling is ported from the in-experience reader (src/ArticleReader.tsx) so the
// long-form pages read identically: Source Serif body, silicon-blue (#8aa9ff)
// accents, solid panels. These are all server components (no hooks), so MDX body
// content stays server-rendered and SEO-indexable. Interactive, per-article
// visualizers live in src/components/visualizers and are merged in at render.

type DivProps = ComponentPropsWithoutRef<"div">;

function P(props: ComponentPropsWithoutRef<"p">) {
  return (
    <p
      className="article-serif text-[17px] leading-[1.85] text-white/70 mb-7"
      {...props}
    />
  );
}

function H2({ className, ...props }: ComponentPropsWithoutRef<"h2">) {
  return (
    <h2
      className="article-serif text-[26px] font-semibold tracking-[-0.01em] text-white/95 mt-14 mb-6 scroll-mt-28"
      {...props}
    />
  );
}

function H3(props: ComponentPropsWithoutRef<"h3">) {
  return (
    <h3
      className="article-serif text-[20px] font-semibold tracking-[-0.01em] text-white/90 mt-10 mb-4 scroll-mt-28"
      {...props}
    />
  );
}

function A(props: ComponentPropsWithoutRef<"a">) {
  const external = typeof props.href === "string" && /^https?:\/\//.test(props.href);
  return (
    <a
      className="text-[#8aa9ff] underline decoration-[#8aa9ff]/30 underline-offset-4 hover:decoration-[#8aa9ff] transition-colors"
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      {...props}
    />
  );
}

function Ul(props: ComponentPropsWithoutRef<"ul">) {
  return <ul className="my-7 flex flex-col gap-3" {...props} />;
}

function Ol(props: ComponentPropsWithoutRef<"ol">) {
  return <ol className="my-7 flex flex-col gap-3 list-decimal pl-5 marker:text-white/40" {...props} />;
}

function Li(props: ComponentPropsWithoutRef<"li">) {
  return (
    <li
      className="article-serif text-[16px] leading-[1.75] text-white/65 marker:text-[#8aa9ff]"
      {...props}
    />
  );
}

function Strong(props: ComponentPropsWithoutRef<"strong">) {
  return <strong className="font-semibold text-white/95" {...props} />;
}

function Em(props: ComponentPropsWithoutRef<"em">) {
  return <em className="italic text-white/80" {...props} />;
}

function Hr() {
  return (
    <div className="flex items-center gap-3 justify-center my-14" aria-hidden>
      <span className="w-10 h-px bg-white/12" />
      <span className="w-1.5 h-1.5 rounded-full bg-white/30" />
      <span className="w-10 h-px bg-white/12" />
    </div>
  );
}

function Blockquote(props: ComponentPropsWithoutRef<"blockquote">) {
  return (
    <blockquote
      className="my-8 border-l-2 border-l-[#8aa9ff]/60 pl-6 article-serif italic text-[18px] leading-[1.7] text-white/70"
      {...props}
    />
  );
}

// `code` is used for BOTH inline code and fenced blocks. Fenced blocks arrive
// with a `language-*` className and are wrapped by <pre>; inline code has none.
function Code({ className, ...props }: ComponentPropsWithoutRef<"code">) {
  const isBlock = typeof className === "string" && className.includes("language-");
  if (isBlock) {
    return (
      <code
        className={`block font-mono text-[13.5px] leading-[1.8] text-[#cdd9f2] ${className}`}
        {...props}
      />
    );
  }
  return (
    <code
      className="font-mono text-[0.85em] text-[#aec3ff] bg-[#8aa9ff]/10 border border-[#8aa9ff]/15 rounded px-1.5 py-0.5"
      {...props}
    />
  );
}

function Pre(props: ComponentPropsWithoutRef<"pre">) {
  return (
    <pre
      className="my-8 rounded-xl border border-white/8 bg-[#0e1118] px-5 py-4 overflow-x-auto scrollbar-thin"
      {...props}
    />
  );
}

// ── Editorial blocks (authored explicitly in MDX) ────────────────────────────

export function Callout({ title, children }: { title?: string; children: ReactNode }) {
  return (
    <aside className="my-8 rounded-xl border border-white/8 border-l-2 border-l-[#8aa9ff]/70 bg-white/[0.025] p-6">
      {title && (
        <div className="text-[11px] font-medium tracking-[0.1em] text-[#8aa9ff] uppercase mb-3">
          {title}
        </div>
      )}
      <div className="[&>p:last-child]:mb-0">{children}</div>
    </aside>
  );
}

export function Challenge({ n, children }: { n?: number; children: ReactNode }) {
  return (
    <aside className="relative my-10 rounded-xl border border-white/8 border-l-2 border-l-[#8aa9ff]/70 bg-white/[0.025] p-7">
      <div className="flex items-center gap-3 mb-4">
        {n != null && (
          <span className="flex items-center justify-center w-7 h-7 rounded-md bg-[#8aa9ff]/12 font-mono text-[12px] text-[#8aa9ff]">
            {n}
          </span>
        )}
        <span className="text-[11px] font-medium tracking-[0.1em] text-[#8aa9ff] uppercase">
          Whiteboard challenge
        </span>
      </div>
      <div className="[&>p]:text-[15.5px] [&>p:last-child]:mb-0">{children}</div>
    </aside>
  );
}

export function Defs({ children }: DivProps) {
  return <div className="grid sm:grid-cols-2 gap-4 my-8">{children}</div>;
}

export function Def({ term, children }: { term: string; children: ReactNode }) {
  return (
    <div className="rounded-xl border border-white/8 bg-white/[0.02] p-5">
      <div className="text-[11px] font-medium tracking-[0.08em] text-[#8aa9ff] uppercase mb-2.5">
        {term}
      </div>
      <p className="article-serif text-[14.5px] leading-[1.7] text-white/65">{children}</p>
    </div>
  );
}

export function Figure({
  src,
  alt,
  caption,
}: {
  src: string;
  alt?: string;
  caption?: string;
}) {
  return (
    <figure className="my-10">
      {/* Plain <img>: article art is author-supplied and already sized. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt ?? caption ?? ""}
        className="w-full rounded-xl border border-white/8"
      />
      {caption && (
        <figcaption className="mt-3 text-center text-[12.5px] text-white/45">
          {caption}
        </figcaption>
      )}
    </figure>
  );
}

export const mdxComponents = {
  p: P,
  h2: H2,
  h3: H3,
  a: A,
  ul: Ul,
  ol: Ol,
  li: Li,
  strong: Strong,
  em: Em,
  hr: Hr,
  blockquote: Blockquote,
  code: Code,
  pre: Pre,
  Callout,
  Challenge,
  Defs,
  Def,
  Figure,
};
