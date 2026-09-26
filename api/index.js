// Vercel Serverless Function entry point for ELAP Express Backend
process.env.VERCEL = process.env.VERCEL || '1';

const serverModule = require('../backend/dist/server.js');
const app = serverModule.default || serverModule.app || serverModule;

module.exports = app;
