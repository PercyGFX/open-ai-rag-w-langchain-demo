import { ChatOpenAI } from "@langchain/openai";
import { Request, Response } from "express";
import { ChatPromptTemplate } from "@langchain/core/prompts";

import Joi from "joi";

const model = new ChatOpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  model: "gpt-3.5-turbo",
  temperature: 0.5,
});

const langchainSchema = Joi.object({
  message: Joi.string().required(),
});

export const langChainchat = async (req: Request, res: Response) => {
  const { error, value } = langchainSchema.validate(req.body);

  const prompt = ChatPromptTemplate.fromTemplate(
    "tell a joke bout from {message}"
  );

  const chain = prompt.pipe(model);

  const response = await chain.invoke({
    message: value.message,
  });

  console.log(response);

  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }

  //const response = await openai.invoke(value.message);

  //console.log(response.content);
};
