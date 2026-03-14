"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";

type Variant = "fadeUp" | "fadeIn" | "fadeLeft" | "fadeRight";

const variants: Record<Variant, { hidden: object; visible: object }> = {
  fadeUp:    { hidden: { opacity: 0, y: 28  }, visible: { opacity: 1, y: 0  } },
  fadeIn:    { hidden: { opacity: 0         }, visible: { opacity: 1        } },
  fadeLeft:  { hidden: { opacity: 0, x: -28 }, visible: { opacity: 1, x: 0  } },
  fadeRight: { hidden: { opacity: 0, x: 28  }, visible: { opacity: 1, x: 0  } },
};

interface Props {
  children: React.ReactNode;
  variant?: Variant;
  delay?: number;
  duration?: number;
  className?: string;
  once?: boolean;
}

export default function AnimateIn({
  children,
  variant = "fadeUp",
  delay = 0,
  duration = 0.55,
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
      variants={variants[variant]}
      transition={{ duration, delay, ease: [0.22, 1, 0.36, 1] }}
      suppressHydrationWarning
    >
      {children}
    </motion.div>
  );
}
