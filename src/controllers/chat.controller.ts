import { Request, Response } from "express";
import Joi from "joi";
import OpenAI from "openai";
import dotenv from "dotenv";

dotenv.config();

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const chatValidation = Joi.object({
  message: Joi.string().required(),
});

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
          content: "You are a helpful assistant.",
        },
        {
          role: "user",
          content: value.message,
        },
      ],
    });

    return res.json({ message: response.choices[0].message });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};
