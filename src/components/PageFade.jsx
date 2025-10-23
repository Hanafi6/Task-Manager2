// src/components/PageFade.jsx
import { motion } from "framer-motion";

export default function PageFade({ children }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.25 }}
      className="min-h-[60vh]"
    >
      {children}
    </motion.div>
  );
}
