import { ReactNode } from "react";
import { Link } from "react-router-dom";

const LINK_CLASS = "hover:text-ceruleanBlue-100 block";

const FooterLink = ({ href, children }: { href: string; children: ReactNode }) => (
  <a href={href} className={LINK_CLASS}>
    {children}
  </a>
);

// The site footer: links, socials, the dRPC badge and the credits. The landing page and the Dataset Playground page use it.
const Footer = () => (
  <footer className="text-center md:text-left px-4 py-8 md:px-8 md:py-12 bg-ceruleanBlue-500 text-white text-lg" id="footer">
    <nav className="font-vt323 flex flex-col flex-wrap gap-4 max-w-5xl mx-auto items-center">
      <div className="flex flex-col items-center text-xl">
        <div className="text-ceruleanBlue-200 flex flex-col md:flex-row flex-wrap justify-center gap-x-8">
          <FooterLink href="https://docs.sourcify.dev">Documentation</FooterLink>
          <FooterLink href="https://docs.sourcify.dev/blog/">Blog</FooterLink>
          <FooterLink href="https://docs.sourcify.dev/docs/repository/">Contract Repository</FooterLink>
          {/* Same site: a router link, so the page does not load again */}
          <Link to="/dataset-playground" className={LINK_CLASS}>
            Dataset Playground
          </Link>
          <FooterLink href="https://playground.sourcify.dev">Metadata Playground</FooterLink>
          <FooterLink href="https://github.com/orgs/argotorg/projects/33">Project Board</FooterLink>
          <FooterLink href="https://github.com/orgs/argotorg/projects/33/views/3">Milestones</FooterLink>
          <FooterLink href="https://github.com/sourcifyeth/assets">Brand Resources</FooterLink>
        </div>
      </div>
      <div className="flex flex-col items-center">
        <h3 className="uppercase font-bold text-ceruleanBlue-100 text-2xl">Socials</h3>
        <div className="flex flex-col md:flex-row flex-wrap gap-x-6 text-ceruleanBlue-200 justify-center">
          <FooterLink href="https://x.com/sourcifyeth">X (Twitter)</FooterLink>
          <FooterLink href="https://discord.gg/6aqd9cfZ9s">Discord</FooterLink>
          <FooterLink href="https://matrix.to/#/#ethereum_source-verify:gitter.im">Matrix</FooterLink>
          <FooterLink href="https://github.com/argotorg/sourcify">GitHub (main)</FooterLink>
          <FooterLink href="https://github.com/sourcifyeth">GitHub (organization)</FooterLink>
          <FooterLink href="mailto:hello@sourcify.dev">E-Mail</FooterLink>
        </div>
      </div>
    </nav>
    <div className="text-center text-sm mt-8 text-ceruleanBlue-300">
      <a href="https://drpc.org?ref=7ef756" target="_blank" rel="noopener noreferrer" className="inline-block mb-4">
        <img width={160} height={40} src="https://drpc.org/images/external/powered-by-drpc-light.svg" alt="Powered by dRPC" />
      </a>
      <div className="text-base mb-1">
        Made with ❤️ by{" "}
        <a href="https://argot.org" target="_blank" rel="noopener noreferrer" className="hover:text-ceruleanBlue-100 underline">
          Argot Collective
        </a>{" "}
      </div>
      <div>{new Date().getFullYear()} • sourcify.eth</div>
    </div>
  </footer>
);

export default Footer;
