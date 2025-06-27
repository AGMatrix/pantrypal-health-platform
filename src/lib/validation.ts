// src/lib/validation.ts
// Comprehensive input validation

import { z } from 'zod';

export const recipeSchema = z.object({
  title: z.string().min(3).max(100),
  ingredients: z.array(z.object({
    name: z.string().min(1).max(100),
    amount: z.number().positive(),
    unit: z.string().min(1).max(20)
  })).min(1).max(50),
  instructions: z.array(z.string().min(5)).min(1).max(20),
  cookingTime: z.number().int().min(1).max(1440),
  servings: z.number().int().min(1).max(50)
});

export const searchSchema = z.object({
  q: z.string().max(100).optional(),
  cuisine: z.string().max(30).optional(),
  maxTime: z.number().int().positive().optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(50).default(20)
});