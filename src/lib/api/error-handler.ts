import { NextResponse } from 'next/server';
import { AppError, ValidationError } from '@/lib/errors/app-errors';

export function handleApiError(error: unknown) {
  if (error instanceof ValidationError) {
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        code: error.code,
        details: error.details,
      },
      { status: error.statusCode },
    );
  }

  if (error instanceof AppError) {
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        code: error.code,
        details: error.details,
      },
      { status: error.statusCode },
    );
  }

  console.error('Unexpected API error:', error);

  return NextResponse.json(
    {
      success: false,
      error: 'Internal server error',
      code: 'INTERNAL_ERROR',
    },
    { status: 500 },
  );
}


