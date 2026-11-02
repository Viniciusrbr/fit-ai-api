import z from 'zod';

// Schema compartilhado de resposta de erro — schemas por recurso vivem em
// src/controllers/<recurso>/schemas.ts
export const ErrorSchema = z.object({
	error: z.string(),
	code: z.string(),
});

// Rotas protegidas por verifyAuth — o scheme "sessionCookie" é declarado em app.ts
export const sessionAuth = [{ sessionCookie: [] }];

interface ErrorResponseOptions {
	description: string;
	example: z.infer<typeof ErrorSchema>;
}

// Mesmo formato do ErrorSchema, com descrição e exemplo para a documentação (OpenAPI/Scalar)
export const errorResponse = ({ description, example }: ErrorResponseOptions) =>
	ErrorSchema.meta({ description, example });

export const ValidationErrorSchema = errorResponse({
	description:
		'Parâmetros, query ou body inválidos (`VALIDATION_ERROR`). O campo `error` indica onde está o problema.',
	example: { error: 'params/workoutPlanId Invalid UUID', code: 'VALIDATION_ERROR' },
});

export const UnauthorizedErrorSchema = errorResponse({
	description: 'Sessão ausente ou expirada (`UNAUTHORIZED`). Faça login em `/api/auth`.',
	example: { error: 'Unauthorized', code: 'UNAUTHORIZED' },
});

export const InternalErrorSchema = errorResponse({
	description: 'Erro inesperado no servidor (`INTERNAL_SERVER_ERROR`).',
	example: { error: 'Internal server error', code: 'INTERNAL_SERVER_ERROR' },
});
