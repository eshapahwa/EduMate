import React from "react";
import { motion } from "framer-motion";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import Tutor from "./components/Tutor";
import Quiz from "./components/Quiz";
import Flashcards from "./components/Flashcards";
import PDFTutor from "./components/PDFTutor"; // Add import for PDFTutor
import Profile from "./pages/Profile";
import ThemeToggle from "./components/ThemeToggle";

export default function EduMateApp() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-100 relative">
      {/* Theme switch button in top-right corner */}
      <ThemeToggle />

      {/* HEADER */}
      <header className="py-10 text-center">
        <h1 className="text-5xl font-extrabold mb-4 text-blue-800 dark:text-blue-400">
          EduMate
        </h1>
        <p className="text-lg tracking-wide text-gray-700 dark:text-gray-300">
          Your AI Study Buddy
        </p>
      </header>

      {/* MAIN CONTENT */}
      <main className="max-w-5xl mx-auto px-4 pb-10">
        <div className="w-full bg-white dark:bg-gray-800 rounded-xl px-6 py-6 shadow-lg border border-gray-200 dark:border-gray-700">
          <Tabs defaultValue="tutor">
            {/* Tabs List */}
            <TabsList className="grid grid-cols-2 md:grid-cols-5 gap-4 w-fit mx-auto p-4 bg-blue-50 dark:bg-blue-800 rounded-3xl">
              <TabsTrigger
                value="tutor"
                className="flex flex-col items-center space-y-1 px-3 py-2 text-lg 
                           data-[state=active]:bg-blue-200 data-[state=active]:text-blue-800 
                           dark:data-[state=active]:bg-blue-900 dark:data-[state=active]:text-blue-400"
              >
                <span className="text-3xl">🧠</span>
                <span>Tutor</span>
              </TabsTrigger>

              <TabsTrigger
                value="pdftutor"
                className="flex flex-col items-center space-y-1 px-3 py-2 text-lg 
                           data-[state=active]:bg-blue-200 data-[state=active]:text-blue-800 
                           dark:data-[state=active]:bg-blue-900 dark:data-[state=active]:text-blue-400"
              >
                <span className="text-3xl">📚</span>
                <span>PDF Tutor</span>
              </TabsTrigger>

              <TabsTrigger
                value="quiz"
                className="flex flex-col items-center space-y-1 px-3 py-2 text-lg 
                           data-[state=active]:bg-blue-200 data-[state=active]:text-blue-800 
                           dark:data-[state=active]:bg-blue-900 dark:data-[state=active]:text-blue-400"
              >
                <span className="text-3xl">🧪</span>
                <span>Quiz</span>
              </TabsTrigger>

              <TabsTrigger
                value="flashcards"
                className="flex flex-col items-center space-y-1 px-3 py-2 text-lg 
                           data-[state=active]:bg-blue-200 data-[state=active]:text-blue-800 
                           dark:data-[state=active]:bg-blue-900 dark:data-[state=active]:text-blue-400"
              >
                <span className="text-3xl">🎴</span>
                <span>Flashcards</span>
              </TabsTrigger>

              <TabsTrigger
                value="profile"
                className="flex flex-col items-center space-y-1 px-3 py-2 text-lg 
                           data-[state=active]:bg-blue-200 data-[state=active]:text-blue-800 
                           dark:data-[state=active]:bg-blue-900 dark:data-[state=active]:text-blue-400"
              >
                <span className="text-3xl">👤</span>
                <span>Profile</span>
              </TabsTrigger>
            </TabsList>

            {/* Tabs Content */}
            <TabsContent value="tutor">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
              >
                <Tutor />
              </motion.div>
            </TabsContent>

            {/* Add new PDF Tutor tab content */}
            <TabsContent value="pdftutor">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
              >
                <PDFTutor />
              </motion.div>
            </TabsContent>

            <TabsContent value="quiz">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
              >
                <Quiz />
              </motion.div>
            </TabsContent>

            <TabsContent value="flashcards">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
              >
                <Flashcards />
              </motion.div>
            </TabsContent>

            <TabsContent value="profile">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
              >
                <Profile />
              </motion.div>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}