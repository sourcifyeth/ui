import React from "react";
import matrix from "../../assets/matrix.svg";
import discord from "../../assets/discord.svg";

export default function Contact() {
  return (
    <section className="px-8 md:px-12 lg:px-24 bg-ceruleanBlue-500 py-16" id="contact">
      <div className="flex flex-col items-center justify-center">
        <h1 className="text-5xl text-gray-100 font-bold mb-12">Get in touch</h1>

        <div className="flex flex-wrap justify-center gap-4">
          <a
            href="https://matrix.to/#/#ethereum_source-verify:gitter.im"
            rel="noreferrer"
            target="_blank"
            className="bg-gray-100 hover:bg-gray-200 rounded-xl p-4 w-64 text-center transition duration-200"
          >
            <img src={matrix} alt="Matrix logo" className="w-28 m-auto" style={{ height: "35px" }} />
          </a>

          <a
            href="https://discord.gg/6aqd9cfZ9s"
            rel="noreferrer"
            target="_blank"
            className="bg-gray-100 hover:bg-gray-200 rounded-xl p-4 w-64 text-center transition duration-200"
          >
            <img src={discord} alt="Discord logo" className="w-28 m-auto" style={{ height: "35px" }} />
          </a>

          <a
            className="bg-gray-100 hover:bg-gray-200 rounded-xl font-bold p-4 w-64 text-center flex items-center justify-center transition duration-200"
            href="mailto:hello@sourcify.dev"
          >
            hello@sourcify.dev
          </a>
        </div>
      </div>
    </section>
  );
}
