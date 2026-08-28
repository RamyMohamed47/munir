import { writeFileSync } from 'node:fs';
import openApiDocument from '../docs/openapi.js';

const outputPath = new URL('../docs/openapi.json', import.meta.url);

writeFileSync(outputPath, `${JSON.stringify(openApiDocument, null, 2)}\n`);

console.log('Exported Swagger contract to docs/openapi.json');
