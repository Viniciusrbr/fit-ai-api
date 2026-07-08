import z from 'zod';

// Schema compartilhado de resposta de erro — schemas por recurso vivem em
// src/controllers/<recurso>/schemas.ts
export const ErrorSchema = z.object({
	error: z.string(),
	code: z.string(),
});
