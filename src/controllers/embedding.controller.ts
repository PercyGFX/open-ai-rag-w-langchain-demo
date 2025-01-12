import { PrismaClient } from "@prisma/client";
import { Request, Response } from "express";
import Joi from "joi";
import OpenAI from "openai";
import dotenv from "dotenv";

dotenv.config();

const prisma = new PrismaClient();

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const embeddingValidation = Joi.object({
  text: Joi.string().required(),
});

export const embedding = async (req: Request, res: Response) => {
  try {
    const { error, value } = embeddingValidation.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    // Generate embedding using OpenAI
    const embeddingResponse = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: value.text,
      encoding_format: "float",
    });

    // Extract the embedding vector
    const embeddingVector = embeddingResponse.data[0].embedding;

    // console.log(embeddingVector);

    const document = await prisma.$executeRaw`
    INSERT INTO documents (content, embedding)
    VALUES (${value.text}, ${JSON.stringify(embeddingVector)}::vector(1536))
    RETURNING *;
  `;

    console.log(document);

    return res.status(201).json({
      message: "Document and embedding created successfully",
      //document,
    });
  } catch (error) {
    console.error("Error creating embedding:", error);
    return res.status(500).json({ error: "Failed to create embedding" });
  }
};
