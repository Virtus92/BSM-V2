import { NextLogo } from "./next-logo";
import { SupabaseLogo } from "./supabase-logo";

export function Hero() {
  return (
    <div className="flex flex-col gap-16 items-center">
      <div className="flex gap-8 justify-center items-center">
        <a
          href="https://supabase.com/?utm_source=create-next-app&utm_medium=template&utm_term=nextjs"
          target="_blank"
          rel="noreferrer"
        >
          <SupabaseLogo />
        </a>
        <span className="border-l rotate-45 h-6" />
        <a href="https://nextjs.org/" target="_blank" rel="noreferrer">
          <NextLogo />
        </a>
      </div>
      <h1 className="sr-only">Rising BSM V2 - Business Service Management</h1>
      <p className="text-3xl lg:text-4xl !leading-tight mx-auto max-w-xl text-center">
        <span className="font-bold text-primary">Rising BSM V2</span>
        <br />
        <span className="text-2xl lg:text-3xl text-muted-foreground">
          Business Service Management Platform
        </span>
        <br />
        <span className="text-lg lg:text-xl">
          Built with{" "}
          <a
            href="https://supabase.com/"
            target="_blank"
            className="font-semibold hover:underline"
            rel="noreferrer"
          >
            Supabase
          </a>{" "}
          and{" "}
          <a
            href="https://nextjs.org/"
            target="_blank"
            className="font-semibold hover:underline"
            rel="noreferrer"
          >
            Next.js
          </a>
        </span>
      </p>
      <div className="w-full p-[1px] bg-gradient-to-r from-transparent via-foreground/10 to-transparent my-8" />
    </div>
  );
}
