import { ChatOpenAI } from "@langchain/openai";
import { Request, Response } from "express";
import Joi from "joi";

const openai = new ChatOpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  model: "gpt-3.5-turbo",
  temperature: 0.5,
});

const langchainSchema = Joi.object({
  message: Joi.string().required(),
});

export const langChainchat = async (req: Request, res: Response) => {
  const { error, value } = langchainSchema.validate(req.body);

  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }

  const response = await openai.invoke(value.message);

  console.log(response.content);
};
