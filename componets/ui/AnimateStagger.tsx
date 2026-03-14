"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";

const container = (stagger: number) => ({
  hidden:  {},
  visible: { transition: { staggerChildren: stagger } },
});

const item = (duration: number) => ({
  hidden:  { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration, ease: [0.22, 1, 0.36, 1] } },
});

interface Props {
  children: React.ReactNode;
  stagger?: number;
  duration?: number;
  className?: string;
  once?: boolean;
}

export function AnimateStagger({
  children,
  stagger = 0.1,
  duration = 0.5,
  className,
  once = true,
}: Props) {
  const ref    = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once, margin: "-60px 0px" });

  return (
    <motion.div
      ref={ref}
      className={className}
      initial="hidden"
      animate={inView ? "visible" : "hidden"}
      variants={container(stagger)}
      suppressHydrationWarning
    >
      {Array.isArray(children)
        ? children.map((child, i) => (
            <motion.div key={i} variants={item(duration)} suppressHydrationWarning>
              {child}
            </motion.div>
          ))
        : <motion.div variants={item(duration)} suppressHydrationWarning>{children}</motion.div>
      }
    </motion.div>
  );
}
