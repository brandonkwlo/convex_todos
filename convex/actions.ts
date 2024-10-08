import { action } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";
import Groq from "groq-sdk";
import { requireUser } from "./helpers";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export const generateTodos = action({
  args: {
    prompt: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const response = await groq.chat.completions.create({
      model: "llama3-8b-8192",
      messages: [
        {
          role: "system",
          content:
            "Generate 3 to-dos based on the given prompt. Please include title and description. Please return a JSON object in the following format: {todos: [{title:string, description:string}] )",
        },
        {
          role: "user",
          content: `Prompt: ${args.prompt}`,
        },
      ],
      response_format: { type: "json_object" },
    });
    const content = JSON.parse(response.choices[0].message.content!) as {
      todos: { title: string; description: string }[];
    };
    await ctx.runMutation(internal.functions.createManyTodos, {
      todos: content.todos,
      userId: user.tokenIdentifier,
    });
    return content.todos;
  },
});
