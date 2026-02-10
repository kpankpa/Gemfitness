import { Variants } from 'framer-motion';

export const staggerContainer: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};

export const fadeUp: Variants = {
  hidden: { y: 12, opacity: 0 },
  show: { y: 0, opacity: 1, transition: { duration: 0.45, ease: [0.2, 0.8, 0.2, 1] } },
};

export const floatSlow: Variants = {
  animate: { y: [0, -8, 0] },
};

export const ctaMicro = {
  hover: { scale: 1.03 },
  tap: { scale: 0.98 },
};
