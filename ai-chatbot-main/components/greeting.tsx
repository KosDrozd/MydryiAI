import { motion } from "framer-motion";

export const Greeting = () => {
  return (
    <div
      // ЗМІНА ТУТ: додано min-h-[500px] для мобільних, щоб картинка мала висоту.
      // overflow-hidden та rounded-3xl додано, щоб закруглити краї картинки як на макеті.
      className="mx-auto mt-4 flex w-full max-w-6xl flex-col md:flex-row justify-center items-start md:items-center px-4 md:mt-16 md:px-8 gap-12 relative min-h-[600px] md:min-h-0 overflow-hidden rounded-3xl md:overflow-visible md:rounded-none"
      key="overview"
    >
      {/* Text section - left */}
      <div className="flex-1 text-left relative z-10 w-full pt-12 md:pt-0 pl-4 md:pl-0">
        <motion.div
          animate={{ opacity: 28, y: 330 }}
          // Додано стилі для білої плашки під текстом
          className="text-2xl md:text-3xl text-blue-500 drop-shadow-lg font-semibold inline-block bg-white p-3 rounded-xl shadow-sm md:bg-transparent md:p-0 md:shadow-none"
          exit={{ opacity: 0, y: 10 }}
          initial={{ opacity: 0, y: 10 }}
          transition={{ delay: 1.5 }}
        >
          Привіт! <span className="text-gray-400 font-normal">UA</span>
        </motion.div>
        
        <div className="mt-4"> {/* Обгортка для відступу */}
            <motion.div
            animate={{ opacity: 35, y: 330 }}
            // Додано стилі для білої плашки під другим рядком
            className="text-2xl md:text-3xl text-yellow-500 drop-shadow-lg font-semibold inline-block bg-white p-3 rounded-xl shadow-sm md:bg-transparent md:p-0 md:shadow-none"
            exit={{ opacity: 0, y: 10 }}
            initial={{ opacity: 0, y: 10 }}
            transition={{ delay: 2.3 }}
            >
            Як я можу вам допомогти?
            </motion.div>
        </div>
      </div>

      {/* Image section */}
      <motion.div
        animate={{ opacity: 1, scale: 1, x: 0 }}
        exit={{ opacity: 0, y: 10 }}
        initial={{ opacity: 0, y: 10 }}
        transition={{ delay: 0.6 }}
        // Картинка на мобільному - це абсолютний фон
        className="absolute inset-0 z-0 flex justify-center items-center md:relative md:flex-1 md:z-auto md:inset-auto"
      >
        <img
          src="/images/Mudryi.jpg"
          alt="Ярослав Мудрий - засновник MudryiAI"
          // object-cover + object-top важливі, щоб обличчя було видно зверху
          className="w-full h-full object-cover object-top md:object-contain md:w-auto md:h-auto md:max-w-sm rounded-none md:rounded-2xl md:shadow-2xl"
        />
      </motion.div>
    </div>
  );
};