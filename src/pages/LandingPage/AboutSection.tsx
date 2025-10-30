import { motion } from "framer-motion";
import { FaDownload } from "react-icons/fa";
import { FaExternalLinkAlt } from "react-icons/fa";

const AboutSection = () => {
  const variants = {
    hidden: { clipPath: "inset(0 100% 0 0)" },
    visible: { clipPath: "inset(0 0 0 0)" },
  };

  return (
    <section className=" bg-gray-100 py-16" id="about">
      <div className="max-w-7xl mx-auto px-4 md:text-left text-center">
        <div className="space-y-12">
          {/* Feature 1 */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={variants}
            transition={{ duration: 0.5 }}
            className="group hover:bg-white hover:shadow-xl p-8 rounded-xl transition-all duration-300"
          >
            <div className="flex flex-col md:flex-row items-center gap-4 md:gap-8 relative">
              <div className="md:w-1/3">
                <h2 className="text-4xl md:text-6xl font-bold text-gray-800 group-hover:text-ceruleanBlue-500 transition-colors duration-300">
                  Open-Source
                </h2>
              </div>
              <div className="hidden md:block h-full min-h-[100px] w-[2px] bg-gray-200 self-stretch" />
              <div className="md:w-2/3">
                <p className="text-lg md:text-xl text-gray-600">
                  Sourcify is and always will be 100% open source.{" "}
                  <a
                    className="text-ceruleanBlue-500 font-medium link-underline"
                    href="https://github.com/argotorg/sourcify"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Github →
                  </a>
                </p>
              </div>
            </div>
          </motion.div>

          {/* Feature 2 */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={variants}
            transition={{ duration: 0.5 }}
            className="group hover:bg-white hover:shadow-xl p-8 rounded-xl transition-all duration-300"
          >
            <div className="flex flex-col md:flex-row items-center gap-4 md:gap-8 relative">
              <div className="md:w-1/3">
                <h2 className="text-4xl md:text-6xl font-bold text-gray-800 group-hover:text-ceruleanBlue-500 transition-colors duration-300">
                  Open-Data
                </h2>
              </div>
              <div className="hidden md:block h-full min-h-[100px] w-[2px] bg-gray-200 self-stretch" />
              <div className="md:w-2/3">
                <p className="text-lg md:text-xl text-gray-600">
                  Verified contract datasets should be open and easily accessible.
                  <br />
                  Sourcify's whole database is available for free and open access.{" "}
                  <a
                    className="text-ceruleanBlue-500 font-medium link-underline"
                    href="https://docs.sourcify.dev/docs/repository/"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <span className="inline-flex items-center gap-1 whitespace-nowrap">
                      <FaDownload className="text-sm" />
                      Download all
                    </span>{" "}
                    verified contracts
                  </a>
                </p>
              </div>
            </div>
          </motion.div>

          {/* Feature 3 */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={variants}
            transition={{ duration: 0.5 }}
            className="group hover:bg-white hover:shadow-xl p-8 rounded-xl transition-all duration-300"
          >
            <div className="flex flex-col md:flex-row items-center gap-4 md:gap-8 relative">
              <div className="md:w-1/3">
                <h2 className="text-4xl md:text-6xl font-bold text-gray-800 group-hover:text-ceruleanBlue-500 transition-colors duration-300">
                  Open-Standards
                </h2>
              </div>
              <div className="hidden md:block h-full min-h-[100px] w-[2px] bg-gray-200 self-stretch" />
              <div className="md:w-2/3 mb-6">
                <p className="text-lg md:text-xl text-gray-600">
                  As a
                  <a href="https://verifieralliance.org" target="_blank" rel="noopener noreferrer">
                    <img
                      src="/verifier-alliance.svg"
                      alt="Verifier Alliance"
                      className="h-16 inline-block -m-3 -mt-5"
                    />
                  </a>{" "}
                  member, Sourcify fosters open standards, data sharing, interoperability, and collaboration between all
                  source code verifiers.
                </p>
              </div>
            </div>
          </motion.div>

          {/* Services Grid */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mt-16"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* 4byte.sourcify.dev */}
              <a
                href="https://4byte.sourcify.dev"
                target="_blank"
                rel="noopener noreferrer"
                className="group bg-white p-6 rounded-xl shadow-md hover:shadow-xl transition-all duration-300 border-2 border-transparent hover:border-ceruleanBlue-500"
              >
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-xl font-bold text-ceruleanBlue-500 group-hover:text-ceruleanBlue-600">
                    4byte.sourcify.dev
                  </h3>
                  <FaExternalLinkAlt className="text-gray-400 group-hover:text-ceruleanBlue-500 transition-colors" />
                </div>
                <p className="text-gray-600">Function and event selector database and openchain.xyz compatible API</p>
              </a>

              {/* verify.sourcify.dev */}
              <a
                href="https://verify.sourcify.dev"
                target="_blank"
                rel="noopener noreferrer"
                className="group bg-white p-6 rounded-xl shadow-md hover:shadow-xl transition-all duration-300 border-2 border-transparent hover:border-ceruleanBlue-500"
              >
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-xl font-bold text-ceruleanBlue-500 group-hover:text-ceruleanBlue-600">
                    verify.sourcify.dev
                  </h3>
                  <FaExternalLinkAlt className="text-gray-400 group-hover:text-ceruleanBlue-500 transition-colors" />
                </div>
                <p className="text-gray-600">Contract verification and verification jobs UI</p>
              </a>

              {/* repo.sourcify.dev */}
              <a
                href="https://repo.sourcify.dev"
                target="_blank"
                rel="noopener noreferrer"
                className="group bg-white p-6 rounded-xl shadow-md hover:shadow-xl transition-all duration-300 border-2 border-transparent hover:border-ceruleanBlue-500"
              >
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-xl font-bold text-ceruleanBlue-500 group-hover:text-ceruleanBlue-600">
                    repo.sourcify.dev
                  </h3>
                  <FaExternalLinkAlt className="text-gray-400 group-hover:text-ceruleanBlue-500 transition-colors" />
                </div>
                <p className="text-gray-600">Explorer for verified contracts</p>
              </a>

              {/* playground.sourcify.dev */}
              <a
                href="https://playground.sourcify.dev"
                target="_blank"
                rel="noopener noreferrer"
                className="group bg-white p-6 rounded-xl shadow-md hover:shadow-xl transition-all duration-300 border-2 border-transparent hover:border-ceruleanBlue-500"
              >
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-xl font-bold text-ceruleanBlue-500 group-hover:text-ceruleanBlue-600">
                    playground.sourcify.dev
                  </h3>
                  <FaExternalLinkAlt className="text-gray-400 group-hover:text-ceruleanBlue-500 transition-colors" />
                </div>
                <p className="text-gray-600">Solidity CBOR metadata decoder</p>
              </a>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default AboutSection;
