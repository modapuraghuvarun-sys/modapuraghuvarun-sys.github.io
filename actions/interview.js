"use server";

import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

export async function generateQuiz() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
    select: {
      industry: true,
      skills: true,
    },
  });

  if (!user) throw new Error("User not found");

  const prompt = `
    Generate 10 technical interview questions for a ${user.industry
    } professional${user.skills?.length ? ` with expertise in ${user.skills.join(", ")}` : ""
    }.
    
    Each question should be multiple choice with 4 options.
    
    Return the response in this JSON format only, no additional text:
    {
      "questions": [
        {
          "question": "string",
          "options": ["string", "string", "string", "string"],
          "correctAnswer": "string",
          "explanation": "string"
        }
      ]
    }
  `;

  try {
    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();
    const cleanedText = text.replace(/```(?:json)?\n?/g, "").trim();
    const quiz = JSON.parse(cleanedText);

    return quiz.questions;
  } catch (error) {
    console.error("Gemini API Error (Using Fallback Data):", error.message);
    // Fallback Mock Quiz Data - Pool of questions
    const mockQuestions = [
      {
        question: "What is the primary function of a database index?",
        options: ["To slow down query performance", "To structure the database capabilities", "To speed up data retrieval operations", "To encrypt the data"],
        correctAnswer: "To speed up data retrieval operations",
        explanation: "Indexes are data structures used to locate data quickly without having to search every row in a database table."
      },
      {
        question: "Which HTTP method is typically used to create a new resource?",
        options: ["GET", "PUT", "POST", "DELETE"],
        correctAnswer: "POST",
        explanation: "POST is typically used to submit an entity to the specified resource, often resulting in a change in state or side effects on the server."
      },
      {
        question: "What does CSS stand for?",
        options: ["Computer Style Sheets", "Cascading Style Sheets", "Creative Style Sheets", "Colorful Style Sheets"],
        correctAnswer: "Cascading Style Sheets",
        explanation: "CSS stands for Cascading Style Sheets and is used for describing the presentation of a document written in a markup language."
      },
      {
        question: "In JavaScript, what is the output of '2' + 2?",
        options: ["4", "22", "NaN", "Error"],
        correctAnswer: "22",
        explanation: "When adding a string and a number, JavaScript converts the number to a string and concatenates them."
      },
      {
        question: "What is Git?",
        options: ["A programming language", "A database management system", "A distributed version control system", "A web server"],
        correctAnswer: "A distributed version control system",
        explanation: "Git is a distributed version control system for tracking changes in source code during software development."
      },
      {
        question: "What is the difference between specific and implicit assertions?",
        options: ["Specific assertions are better", "Implicit assertions run faster", "They determine how testing tools validate behavior", "There is no difference"],
        correctAnswer: "They determine how testing tools validate behavior",
        explanation: "Implicit assertions are automatic checks performed by the test runner, while specific assertions are manually written validation steps."
      },
      {
        question: "What is a closure in JavaScript?",
        options: ["A function with no name", "A function that has access to its outer function scope", "A method to close a window", "A variable that cannot be changed"],
        correctAnswer: "A function that has access to its outer function scope",
        explanation: "A closure is the combination of a function bundled together (enclosed) with references to its surrounding state (the lexical environment)."
      },
      {
        question: "What does SQL stand for?",
        options: ["Structured Query Language", "Simple Question Language", "Strong Query Logic", "System Query Language"],
        correctAnswer: "Structured Query Language",
        explanation: "SQL (Structured Query Language) is the standard language for relational database management systems."
      },
      {
        question: "What is the purpose of the 'finally' block in a try-catch statement?",
        options: ["To execute code only if an error occurs", "To stop the script execution", "To execute code regardless of the result", "To restart the try block"],
        correctAnswer: "To execute code regardless of the result",
        explanation: "The finally block lets you execute code, after try and catch, regardless of the result."
      },
      {
        question: "Which of these is NOT a valid JSON data type?",
        options: ["String", "Number", "Function", "Boolean"],
        correctAnswer: "Function",
        explanation: "JSON supports Strings, Numbers, Booleans, Null, Arrays, and Objects, but not Functions."
      },
      {
        question: "What is the DOM?",
        options: ["Document Object Model", "Data Object Model", "Digital Order Method", "Disk Operating Mode"],
        correctAnswer: "Document Object Model",
        explanation: "The DOM is a programming interface for web documents. It represents the page so that programs can change the document structure, style, and content."
      },
      {
        question: "What is React?",
        options: ["A database", "A JavaScript library for building user interfaces", "A server-side framework", "A design pattern"],
        correctAnswer: "A JavaScript library for building user interfaces",
        explanation: "React is a declarative, efficient, and flexible JavaScript library for building user interfaces."
      },
      {
        question: "What is a Promise in JavaScript?",
        options: ["A guarantee that code will strictly run synchronously", "An object representing the eventual completion or failure of an asynchronous operation", "A committed variable value", "A loop structure"],
        correctAnswer: "An object representing the eventual completion or failure of an asynchronous operation",
        explanation: "A Promise is a proxy for a value not necessarily known when the promise is created."
      },
      {
        question: "Which of the following is used for version control?",
        options: ["Node.js", "Python", "Git", "HTML"],
        correctAnswer: "Git",
        explanation: "Git is a version control system that lets you manage and keep track of your source code history."
      },
      {
        question: "What stands for API?",
        options: ["Apple Pie Interface", "Application Programming Interface", "Advanced Peripheral Integration", "Automated Protocol Interaction"],
        correctAnswer: "Application Programming Interface",
        explanation: "API stands for Application Programming Interface, which is a set of definitions and protocols for building and integrating application software."
      }
    ];

    // Shuffle and select 10 questions
    return mockQuestions.sort(() => 0.5 - Math.random()).slice(0, 10);
  }
}

export async function saveQuizResult(questions, answers, score) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
  });

  if (!user) throw new Error("User not found");

  const questionResults = questions.map((q, index) => ({
    question: q.question,
    answer: q.correctAnswer,
    userAnswer: answers[index],
    isCorrect: q.correctAnswer === answers[index],
    explanation: q.explanation,
  }));

  // Get wrong answers
  const wrongAnswers = questionResults.filter((q) => !q.isCorrect);

  // Only generate improvement tips if there are wrong answers
  let improvementTip = null;
  if (wrongAnswers.length > 0) {
    const wrongQuestionsText = wrongAnswers
      .map(
        (q) =>
          `Question: "${q.question}"\nCorrect Answer: "${q.answer}"\nUser Answer: "${q.userAnswer}"`
      )
      .join("\n\n");

    const improvementPrompt = `
      The user got the following ${user.industry} technical interview questions wrong:

      ${wrongQuestionsText}

      Based on these mistakes, provide a concise, specific improvement tip.
      Focus on the knowledge gaps revealed by these wrong answers.
      Keep the response under 2 sentences and make it encouraging.
      Don't explicitly mention the mistakes, instead focus on what to learn/practice.
    `;

    try {
      const tipResult = await model.generateContent(improvementPrompt);

      improvementTip = tipResult.response.text().trim();
      console.log(improvementTip);
    } catch (error) {
      console.error("Error generating improvement tip:", error);
      // Continue without improvement tip if generation fails
    }
  }

  try {
    const assessment = await db.assessment.create({
      data: {
        userId: user.id,
        quizScore: score,
        questions: questionResults,
        category: "Technical",
        improvementTip,
      },
    });

    return assessment;
  } catch (error) {
    console.error("Error saving quiz result:", error);
    throw new Error("Failed to save quiz result");
  }
}

export async function getAssessments() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
  });

  if (!user) throw new Error("User not found");

  try {
    const assessments = await db.assessment.findMany({
      where: {
        userId: user.id,
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    return assessments;
  } catch (error) {
    console.error("Error fetching assessments:", error);
    throw new Error("Failed to fetch assessments");
  }
}