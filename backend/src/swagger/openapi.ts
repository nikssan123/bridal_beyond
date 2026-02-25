export const openApiDocument = {
  openapi: '3.0.3',
  info: {
    title: 'Bridal Beyond API',
    version: '1.0.0',
    description: 'REST API for the Bridal Beyond C2C marketplace.',
  },
  servers: [{ url: '/api', description: 'API base' }],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
    schemas: {
      User: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          name: { type: 'string' },
          email: { type: 'string', format: 'email' },
        },
      },
      AuthRegisterRequest: {
        type: 'object',
        required: ['name', 'email', 'password'],
        properties: {
          name: { type: 'string' },
          email: { type: 'string', format: 'email' },
          password: { type: 'string', minLength: 6 },
        },
      },
      AuthLoginRequest: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email' },
          password: { type: 'string' },
        },
      },
      AuthResponse: {
        type: 'object',
        properties: {
          user: { $ref: '#/components/schemas/User' },
          token: { type: 'string' },
        },
      },
      SellerSummary: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          name: { type: 'string' },
          avatar: { type: 'string' },
          rating: { type: 'number' },
          listings: { type: 'integer' },
          location: { type: 'string' },
          memberSince: { type: 'string' },
        },
      },
      Measurements: {
        type: 'object',
        properties: {
          bust: { type: 'string' },
          waist: { type: 'string' },
          hips: { type: 'string' },
          length: { type: 'string' },
        },
      },
      Listing: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          title: { type: 'string' },
          description: { type: 'string' },
          price: { type: 'number' },
          originalPrice: { type: 'number' },
          category: { type: 'string', enum: ['wedding', 'graduation', 'evening'] },
          size: { type: 'string' },
          condition: { type: 'string', enum: ['new', 'like-new', 'good', 'fair'] },
          color: { type: 'string' },
          brand: { type: 'string' },
          measurements: { $ref: '#/components/schemas/Measurements' },
          images: { type: 'array', items: { type: 'string' } },
          seller: { $ref: '#/components/schemas/SellerSummary' },
          createdAt: { type: 'string', format: 'date' },
        },
      },
      ListingCreateRequest: {
        type: 'object',
        required: ['title', 'description', 'price', 'category', 'size', 'condition', 'color', 'brand', 'measurements'],
        properties: {
          title: { type: 'string' },
          description: { type: 'string' },
          price: { type: 'number' },
          originalPrice: { type: 'number' },
          category: { type: 'string', enum: ['wedding', 'graduation', 'evening'] },
          size: { type: 'string' },
          condition: { type: 'string', enum: ['new', 'like-new', 'good', 'fair'] },
          color: { type: 'string' },
          brand: { type: 'string' },
          measurements: { $ref: '#/components/schemas/Measurements' },
          images: { type: 'array', items: { type: 'string' }, default: [] },
        },
      },
      Review: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          sellerId: { type: 'string', format: 'uuid' },
          userName: { type: 'string' },
          rating: { type: 'integer', minimum: 1, maximum: 5 },
          comment: { type: 'string' },
          createdAt: { type: 'string', format: 'date' },
        },
      },
      ReviewCreateRequest: {
        type: 'object',
        required: ['rating', 'comment'],
        properties: {
          rating: { type: 'integer', minimum: 1, maximum: 5 },
          comment: { type: 'string' },
          userName: { type: 'string' },
        },
      },
      Error: {
        type: 'object',
        properties: {
          message: { type: 'string' },
          code: { type: 'string' },
        },
      },
    },
  },
  paths: {
    '/auth/register': {
      post: {
        summary: 'Register a new user',
        tags: ['Auth'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/AuthRegisterRequest' },
            },
          },
        },
        responses: {
          '201': {
            description: 'Created',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/AuthResponse' },
              },
            },
          },
          '400': { description: 'Validation error or email exists', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },
    '/auth/login': {
      post: {
        summary: 'Login',
        tags: ['Auth'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/AuthLoginRequest' },
            },
          },
        },
        responses: {
          '200': {
            description: 'OK',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/AuthResponse' },
              },
            },
          },
          '401': { description: 'Invalid credentials', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },
    '/auth/me': {
      get: {
        summary: 'Get current user',
        tags: ['Auth'],
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: 'OK',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    user: {
                      type: 'object',
                      properties: {
                        id: { type: 'string' },
                        name: { type: 'string' },
                        email: { type: 'string' },
                        location: { type: 'string' },
                        memberSince: { type: 'string' },
                        avatarUrl: { type: 'string' },
                      },
                    },
                  },
                },
              },
            },
          },
          '401': { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },
    '/listings': {
      get: {
        summary: 'List listings with optional filters',
        tags: ['Listings'],
        parameters: [
          { name: 'category', in: 'query', schema: { type: 'string', enum: ['wedding', 'graduation', 'evening'] } },
          { name: 'size', in: 'query', schema: { type: 'string' } },
          { name: 'condition', in: 'query', schema: { type: 'string', enum: ['new', 'like-new', 'good', 'fair'] } },
          { name: 'minPrice', in: 'query', schema: { type: 'number' } },
          { name: 'maxPrice', in: 'query', schema: { type: 'number' } },
          { name: 'search', in: 'query', schema: { type: 'string' } },
          { name: 'sortBy', in: 'query', schema: { type: 'string', enum: ['newest', 'price-asc', 'price-desc'] } },
        ],
        responses: {
          '200': {
            description: 'OK',
            content: {
              'application/json': {
                schema: { type: 'array', items: { $ref: '#/components/schemas/Listing' } },
              },
            },
          },
        },
      },
      post: {
        summary: 'Create a listing',
        tags: ['Listings'],
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ListingCreateRequest' },
            },
          },
        },
        responses: {
          '201': {
            description: 'Created',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Listing' },
              },
            },
          },
          '400': { description: 'Validation error', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          '401': { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },
    '/listings/{id}': {
      get: {
        summary: 'Get listing by ID',
        tags: ['Listings'],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          '200': {
            description: 'OK',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Listing' },
              },
            },
          },
          '404': { description: 'Not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },
    '/sellers/{sellerId}': {
      get: {
        summary: 'Get seller summary',
        tags: ['Sellers'],
        parameters: [{ name: 'sellerId', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          '200': {
            description: 'OK',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/SellerSummary' },
              },
            },
          },
          '404': { description: 'Not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },
    '/sellers/{sellerId}/reviews': {
      get: {
        summary: 'List reviews for a seller',
        tags: ['Reviews'],
        parameters: [{ name: 'sellerId', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          '200': {
            description: 'OK',
            content: {
              'application/json': {
                schema: { type: 'array', items: { $ref: '#/components/schemas/Review' } },
              },
            },
          },
        },
      },
      post: {
        summary: 'Create a review for a seller',
        tags: ['Reviews'],
        parameters: [{ name: 'sellerId', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ReviewCreateRequest' },
            },
          },
        },
        responses: {
          '201': {
            description: 'Created',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Review' },
              },
            },
          },
          '400': { description: 'Validation error', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },
  },
};
