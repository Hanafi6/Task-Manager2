// src/components/PageSlide.jsx
import { motion } from "framer-motion";

export default function PageSlide({ children, direction = 1 }) {
  // direction: 1 = slide من يمين لليسار، -1 = عكسه
  const xFrom = 40 * direction;
  return (
    <motion.div
      initial={{ opacity: 0, x: xFrom }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -xFrom }}
      transition={{ type: "spring", stiffness: 260, damping: 24 }}
      className="min-h-[60vh]" // يمنع القفز في الارتفاع
    >
      {children}
    </motion.div>
  );
}
