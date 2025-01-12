import { Request, Response } from "express";
import Joi from "joi";
import OpenAI from "openai";
import dotenv from "dotenv";

dotenv.config();

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const chatValidation = Joi.object({
  message: Joi.string().required(),
});

const timeAndDate = () => {
  const date = new Date();
  return date.toLocaleString();
};

export const chat = async (req: Request, res: Response) => {
  try {
    const { error, value } = chatValidation.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are a helpful assistant. When asked about time or date, use the timeAndDate function.",
        },
        {
          role: "user",
          content: value.message,
        },
      ],
      tools: [
        {
          type: "function",
          function: {
            name: "timeAndDate",
            description: "Get the current time and date",
            parameters: {
              type: "object",
              properties: {},
              required: []
            }
          }
        }
      ],
      tool_choice: "auto"
    });

    const assistantMessage = response.choices[0].message;

    if (assistantMessage.tool_calls) {
      const toolCall = assistantMessage.tool_calls[0];
      if (toolCall.function.name === "timeAndDate") {
        const dateTimeResponse = timeAndDate();
        
        const finalResponse = await openai.chat.completions.create({
          model: "gpt-3.5-turbo",
          messages: [
            {
              role: "assistant",
              content: assistantMessage.content || "",
              tool_calls: assistantMessage.tool_calls
            },
            {
              role: "tool",
              content: dateTimeResponse,
              tool_call_id: toolCall.id
            }
          ]
        });

        return res.json({ message: finalResponse.choices[0].message });
      }
    }

    return res.json({ message: assistantMessage });

  } catch (err) {
    console.log(err);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};