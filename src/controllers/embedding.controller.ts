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

////////// embedding chat ////

const chatValidation = Joi.object({
  message: Joi.string().required(),
});

export const chatEmbed = async (req: Request, res: Response) => {
  try {
    const { error, value } = chatValidation.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    // First, get relevant documents from vector search
    const embeddingResponse = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: value.message,
      encoding_format: "float",
    });

    const searchVector = embeddingResponse.data[0].embedding;

    // Get relevant documents
    const relevantDocs: any = await prisma.$queryRaw`
        SELECT content, 1 - (embedding <=> ${JSON.stringify(
          searchVector
        )}::vector(1536)) as similarity
        FROM documents
        WHERE embedding IS NOT NULL
        ORDER BY embedding <=> ${JSON.stringify(searchVector)}::vector(1536)
        LIMIT 3;
      `;

    // Create context from relevant documents
    const context = relevantDocs.map((doc: any) => doc.content).join("\n");

    // Create chat completion with context
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: `You are a helpful assistant. Use the following context to help answer questions, but also use your general knowledge when needed. If the context isn't relevant, just respond normally.\n\nContext:\n${context}`,
        },
        {
          role: "user",
          content: value.message,
        },
      ],
    });

    let finalResponse;

    finalResponse = response.choices[0].message.content;

    return res.json({
      response: finalResponse,
      // relevantDocs: relevantDocs,
    });
  } catch (error) {
    console.error("Error in chat endpoint:", error);
    return res.status(500).json({ error: "Failed to process chat request" });
  }
};
