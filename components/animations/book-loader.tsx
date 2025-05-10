"use client";

import { motion } from "framer-motion";

export function BookLoader() {
  return (
    <div className="flex min-h-[200px] items-center justify-center">
      <motion.div
        className="relative h-20 w-36"
        animate={{ rotateY: 180 }}
        transition={{
          repeat: Number.POSITIVE_INFINITY,
          repeatType: "reverse",
          duration: 1.2,
          ease: "easeInOut",
        }}
      >
        {/* Book cover */}
        <motion.div
          className="absolute inset-0 rounded-r-md rounded-l-sm bg-primary shadow-lg"
          animate={{ rotateY: [0, -180] }}
          transition={{
            repeat: Number.POSITIVE_INFINITY,
            repeatType: "reverse",
            duration: 1.2,
            ease: "easeInOut",
          }}
        >
          <div className="absolute inset-y-0 left-2 w-[1px] bg-primary-foreground/20"></div>
          <div className="absolute inset-0 border-l border-primary-foreground/30 rounded-l-sm"></div>
        </motion.div>

        {/* Pages */}
        {[...Array(5)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute inset-0 origin-left rounded-r-sm bg-whitedark:bg-[#1e1e1c]-gray-200"
            initial={{ rotateY: 0 }}
            animate={{ rotateY: -180 }}
            transition={{
              repeat: Number.POSITIVE_INFINITY,
              repeatType: "reverse",
              duration: 1.2,
              ease: "easeInOut",
              delay: i * 0.1,
            }}
            style={{
              zIndex: 5 - i,
            }}
          >
            <div className="absolute inset-y-0 left-0 w-2 bg-gradient-to-r from-gray-200 to-transparent dark:from-gray-300"></div>
            <div className="absolute inset-y-2 left-6 w-[1px] bg-gray-300/80dark:bg-[#1e1e1c]-gray-400/80"></div>
            <div className="absolute inset-y-3 right-3 h-full w-2/3">
              <div className="mb-1 h-1 w-full bg-gray-300dark:bg-[#1e1e1c]-gray-400"></div>
              <div className="mb-1 h-1 w-2/3 bg-gray-300dark:bg-[#1e1e1c]-gray-400"></div>
              <div className="mb-1 h-1 w-1/2 bg-gray-300dark:bg-[#1e1e1c]-gray-400"></div>
            </div>
          </motion.div>
        ))}

        <p className="absolute -bottom-8 left-0 right-0 text-center text-sm text-muted-foreground">
          Loading...
        </p>
      </motion.div>
    </div>
  );
}
