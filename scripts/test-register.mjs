import { register } from 'node:module';
import { pathToFileURL } from 'node:url';

register('./scripts/test-ts-loader.mjs', pathToFileURL('./'));
