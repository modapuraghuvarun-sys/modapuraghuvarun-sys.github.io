const { GoogleGenerativeAI } = require("@google/generative-ai");
require("dotenv").config({ path: ".env" });

const models = [
    "gemini-1.5-flash",
    "gemini-1.5-flash-latest",
    "gemini-1.5-pro",
    "gemini-pro",
    "gemini-1.0-pro"
];

async function listModels() {
    console.log("Checking API Key:", process.env.GEMINI_API_KEY ? "Present" : "Missing");
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

    for (const modelName of models) {
        console.log(`\nTesting ${modelName}...`);
        const model = genAI.getGenerativeModel({ model: modelName });
        try {
            await model.generateContent("Hello");
            console.log(`SUCCESS: ${modelName} is working!`);
            return; // Stop at first success
        } catch (e) {
            console.log(`FAIL: ${modelName} failed.`);
            console.log(`Error: ${e.message.split('\n')[0]}`); // Print first line of error
        }
    }
    console.log("\nAll models failed.");
}

listModels();
