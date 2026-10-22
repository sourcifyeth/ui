import type { ReactNode } from "react";
import { FaDiscord } from "react-icons/fa";
import { FiArrowRight, FiMail } from "react-icons/fi";
import { SiMatrix } from "react-icons/si";

type Channel = { name: string; detail: string; href: string; icon: ReactNode; external: boolean };

const CHANNELS: Channel[] = [
  {
    name: "Matrix",
    detail: "Chat with the team",
    href: "https://matrix.to/#/#ethereum_source-verify:gitter.im",
    icon: <SiMatrix aria-hidden="true" />,
    external: true,
  },
  {
    name: "Discord",
    detail: "Join the community",
    href: "https://discord.gg/6aqd9cfZ9s",
    icon: <FaDiscord aria-hidden="true" />,
    external: true,
  },
  {
    name: "Email",
    detail: "hello@sourcify.dev",
    href: "mailto:hello@sourcify.dev",
    icon: <FiMail aria-hidden="true" />,
    external: false,
  },
];

export default function Contact() {
  return (
    <section className="px-4 md:px-8 py-12 md:py-20" id="contact">
      <div className="mx-auto flex max-w-5xl flex-col items-center">
        <div className="mb-10 text-center md:mb-12">
          <h2 className="text-4xl md:text-5xl text-gray-800 font-bold">Get in touch</h2>
          <p className="mt-3 text-base text-gray-600 md:text-lg">Questions, bugs or a new chain? Talk to us.</p>
        </div>

        {/* White cards with a thin border, like the Self Hosting block */}
        <ul className="grid w-full max-w-3xl grid-cols-1 gap-4 sm:grid-cols-3">
          {CHANNELS.map((channel) => (
            <li key={channel.name}>
              <a
                href={channel.href}
                {...(channel.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                className="group flex h-full items-center gap-4 rounded-xl bg-white p-4 shadow-sm ring-1 ring-gray-200 transition-colors hover:ring-ceruleanBlue-200 sm:flex-col sm:items-start sm:p-5"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-ceruleanBlue-50 text-xl text-ceruleanBlue-500">
                  {channel.icon}
                </span>
                <span className="min-w-0">
                  <span className="flex items-center gap-1 font-semibold text-gray-800">
                    {channel.name}
                    <FiArrowRight
                      className="text-gray-400 transition-transform group-hover:translate-x-0.5 group-hover:text-ceruleanBlue-500"
                      aria-hidden="true"
                    />
                  </span>
                  <span className="block truncate text-sm text-gray-600">{channel.detail}</span>
                </span>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
