import { motion } from "framer-motion";

export const Greeting = () => {
  return (
    <div
      className="mx-auto mt-4 flex size-full max-w-6xl flex-col md:flex-row justify-center items-center px-4 md:mt-16 md:px-8 gap-12"
      key="overview"
    >
      {/* Text section - left */}
      <div className="flex-1 text-center md:text-left">
        <motion.div
          animate={{ opacity: 1, y: 0 }}
          className="font-semibold text-4xl md:text-5xl bg-gradient-to-r from-blue-600 to-yellow-500 bg-clip-text text-transparent drop-shadow-lg"
          exit={{ opacity: 0, y: 10 }}
          initial={{ opacity: 0, y: 10 }}
          transition={{ delay: 0.5 }}
        >
          Привіт! 🇺🇦
        </motion.div>
        <motion.div
          animate={{ opacity: 1, y: 0 }}
          className="text-2xl md:text-3xl text-yellow-500 drop-shadow-lg mt-6 font-semibold"
          exit={{ opacity: 0, y: 10 }}
          initial={{ opacity: 0, y: 10 }}
          transition={{ delay: 0.6 }}
        >
          Як я можу вам допомогти?
        </motion.div>
      </div>

      {/* Image section - right */}
      <motion.div
        animate={{ opacity: 1, scale: 1, x: 0 }}
        exit={{ opacity: 0, scale: 0.9, x: 50 }}
        initial={{ opacity: 0, scale: 0.9, x: 50 }}
        transition={{ delay: 0.7 }}
        className="flex-1 flex justify-center hidden md:flex"
      >
        <img
          src="/images/Mudryi.jpg"
          alt="Ярослав Мудрий - засновник MudryiAI"
          className="rounded-2xl shadow-2xl max-w-sm h-auto"
        />
      </motion.div>
    </div>
  );
};
