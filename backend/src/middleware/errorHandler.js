export const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  // Prisma errors
  if (err.code === 'P2002') {
    return res.status(400).json({ 
      error: 'A record with this unique field already exists' 
    });
  }

  if (err.code === 'P2025') {
    return res.status(404).json({ 
      error: 'Record not found' 
    });
  }

  // Zod validation errors
  if (err.name === 'ZodError') {
    return res.status(400).json({ 
      error: 'Validation error',
      details: err.errors 
    });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ error: 'Invalid token' });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({ error: 'Token expired' });
  }

  // Default error
  res.status(err.statusCode || 500).json({ 
    error: err.message || 'Internal server error' 
  });
};

export const notFound = (req, res) => {
  res.status(404).json({ error: 'Route not found' });
};
