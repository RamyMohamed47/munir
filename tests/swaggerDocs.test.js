import { describe, expect, it } from '@jest/globals';
import { readFileSync } from 'node:fs';
import request from 'supertest';
import app from '../app.js';
import openApiDocument from '../docs/openapi.js';

const exportedOpenApiDocument = JSON.parse(
  readFileSync(new URL('../docs/openapi.json', import.meta.url), 'utf8'),
);

describe('Swagger documentation', () => {
  it('keeps the shareable JSON export synchronized with the application spec', () => {
    expect(exportedOpenApiDocument).toEqual(openApiDocument);
  });

  it('serves a valid OpenAPI document containing the implemented routes', async () => {
    const response = await request(app).get('/api-docs.json').expect(200);

    expect(response.body.openapi).toBe('3.0.3');
    expect(response.body.components.securitySchemes.bearerAuth).toMatchObject({
      type: 'http',
      scheme: 'bearer',
    });
    expect(response.body.paths).toEqual(
      expect.objectContaining({
        '/messages': expect.any(Object),
        '/messages/scheduled-messages': expect.any(Object),
        '/messages/{id}': expect.any(Object),
        '/users': expect.any(Object),
        '/users/me': expect.any(Object),
        '/users/statistics': expect.any(Object),
        '/users/{id}': expect.any(Object),
        '/users/{id}/messages': expect.any(Object),
      }),
    );
    expect(response.body.paths['/messages/scheduled-messages'].post).toBeDefined();
  });

  it('serves the Swagger UI', async () => {
    const response = await request(app).get('/api-docs/').expect(200);

    expect(response.type).toMatch(/html/);
    expect(response.text).toContain('<title>Munir API Documentation</title>');
    expect(response.text).toContain('id="swagger-ui"');
  });
});
