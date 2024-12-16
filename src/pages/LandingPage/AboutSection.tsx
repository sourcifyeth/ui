import { motion } from "framer-motion";

const AboutSection = () => {
  const variants = {
    hidden: { clipPath: "inset(0 100% 0 0)" },
    visible: { clipPath: "inset(0 0 0 0)" },
  };

  return (
    <div className="min-h-screen bg-gray-100 py-20">
      <div className="max-w-7xl mx-auto px-4">
        <div className="space-y-24">
          {/* Feature 1 */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={variants}
            transition={{ duration: 0.5 }}
            className="group hover:bg-white hover:shadow-xl p-8 rounded-xl transition-all duration-300"
          >
            <div className="flex flex-col md:flex-row items-start gap-8 relative">
              <div className="md:w-1/3">
                <h2 className="text-6xl font-bold text-gray-800 group-hover:text-blue-600 transition-colors duration-300">
                  Open Source
                </h2>
              </div>
              <div className="md:w-2/3 border-l-2 border-gray-200 pl-8">
                <p className="text-xl text-gray-600">
                  Sourcify is and always will be 100% open source, ensuring transparency and community collaboration.
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
            <div className="flex flex-col md:flex-row items-start gap-8 relative">
              <div className="md:w-1/3">
                <h2 className="text-6xl font-bold text-gray-800 group-hover:text-green-600 transition-colors duration-300">
                  Open Data
                </h2>
              </div>
              <div className="md:w-2/3 border-l-2 border-gray-200 pl-8">
                <p className="text-xl text-gray-600">
                  Access and contribute to our growing database of verified source code and documentation.
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
            <div className="flex flex-col md:flex-row items-start gap-8 relative">
              <div className="md:w-1/3">
                <h2 className="text-6xl font-bold text-gray-800 group-hover:text-purple-600 transition-colors duration-300">
                  Community Driven
                </h2>
              </div>
              <div className="md:w-2/3 border-l-2 border-gray-200 pl-8">
                <p className="text-xl text-gray-600">
                  Join our thriving community of developers and contributors shaping the future of code verification.
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default AboutSection;
