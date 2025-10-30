import { motion } from "framer-motion";
import { FaDownload, FaCheckCircle } from "react-icons/fa";

const AboutSection = () => {
  const variants = {
    hidden: { clipPath: "inset(0 100% 0 0)" },
    visible: { clipPath: "inset(0 0 0 0)" },
  };

  return (
    <section className=" bg-gray-100 py-16" id="about">
      <div className="max-w-7xl mx-auto px-4 md:text-left text-center">
        <div className="space-y-12">
          {/* What You Can Do Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mb-16"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Verify Contracts */}
              <div className="group bg-white p-8 rounded-xl shadow-md hover:shadow-xl transition-all duration-300 border-2 border-transparent hover:border-ceruleanBlue-500">
                <div className="text-center">
                  <FaCheckCircle className="text-5xl mb-4 text-green-500 mx-auto" />
                  <h3 className="text-2xl font-bold text-gray-800 mb-3 group-hover:text-ceruleanBlue-500 transition-colors">
                    Verify Contracts
                  </h3>
                  <p className="text-gray-600">Verify Solidity and Vyper contracts with full metadata support</p>
                </div>
              </div>

              {/* Get ABIs */}
              <div className="group bg-white p-8 rounded-xl shadow-md hover:shadow-xl transition-all duration-300 border-2 border-transparent hover:border-ceruleanBlue-500">
                <div className="text-center">
                  <div className="text-5xl mb-4">📋</div>
                  <h3 className="text-2xl font-bold text-gray-800 mb-3 group-hover:text-ceruleanBlue-500 transition-colors">
                    ABI
                  </h3>
                  <p className="text-gray-600">Fetch verified contract ABIs</p>
                  <p className="text-gray-600 text-sm">
                    {" "}
                    <a
                      href="https://sourcify.dev/server/v2/contract/1/0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48?fields=abi"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-ceruleanBlue-500 font-medium link-underline"
                    >
                      (Example) →
                    </a>
                  </p>
                </div>
              </div>

              {/* 4byte Selectors */}
              <div className="group bg-white p-8 rounded-xl shadow-md hover:shadow-xl transition-all duration-300 border-2 border-transparent hover:border-ceruleanBlue-500">
                <div className="text-center">
                  <div className="text-5xl mb-4">🔍</div>
                  <h3 className="text-2xl font-bold text-gray-800 mb-3 group-hover:text-ceruleanBlue-500 transition-colors">
                    4byte Selectors
                  </h3>
                  <p className="text-gray-600">
                    Extensive signature database including signatures from verified contracts
                  </p>
                  <p className="text-gray-600 text-sm"></p>
                  <a
                    href="https://4byte.sourcify.dev/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-ceruleanBlue-500 font-medium link-underline"
                  >
                    4byte.sourcify.dev →
                  </a>
                </div>
              </div>
            </div>
          </motion.div>

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
        </div>
      </div>
    </section>
  );
};

export default AboutSection;
