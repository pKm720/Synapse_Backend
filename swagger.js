import swaggerJsdoc from 'swagger-jsdoc'
import swaggerUi from 'swagger-ui-express'

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Synapse AI Workflow Automation API',
      version: '1.0.0',
      description: 'API documentation for the Synapse backend execution engine and pipeline manager.',
    },
    servers: [
      { url: process.env.RENDER_EXTERNAL_URL || 'http://localhost:5000', description: 'API Server' }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  apis: ['./src/routes/*.js'], // Points to our route files for inline JSDoc annotations
}

const specs = swaggerJsdoc(options)

export const setupSwagger = (app) => {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs, { customCss: '.swagger-ui .topbar { display: none }' }))
  console.log('[Swagger] Docs available at /api-docs')
}
