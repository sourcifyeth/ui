import { useRef } from "react";
import { motion } from "framer-motion";

const AboutSection = () => {
  return (
    <section className="min-h-screen bg-blue-100 flex items-center justify-center py-16">
      <div className="max-w-6xl mx-auto px-4 space-y-16">
        <motion.div
          initial={{ opacity: 0, x: -100 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="bg-white p-8 rounded-lg shadow-lg"
        >
          <h2 className="text-2xl font-bold mb-4">First Feature</h2>
          <p>This is the first feature that will scroll into view.</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 100 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="bg-white p-8 rounded-lg shadow-lg"
        >
          <h2 className="text-2xl font-bold mb-4">Second Feature</h2>
          <p>As you scroll, this second feature will appear.</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 100 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="bg-white p-8 rounded-lg shadow-lg"
        >
          <h2 className="text-2xl font-bold mb-4">Third Feature</h2>
          <p>Finally, this third feature will show up before section ends.</p>
        </motion.div>
      </div>
    </section>
  );
};

export default AboutSection;
