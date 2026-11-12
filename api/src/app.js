import cors from 'cors'
import express from 'express'
import { DatabaseConfigurationError, getDatabasePool, sql } from './db.js'
import { createApiRouter } from './routes.js'

function allowedOrigins() {
	return (process.env.FRONTEND_ORIGINS || 'http://localhost:5173')
		.split(',')
		.map((origin) => origin.trim())
		.filter(Boolean)
}

export function createApp(getPool = getDatabasePool) {
	const app = express()
	app.disable('x-powered-by')
	app.use(cors({
		origin(origin, callback) {
			if (!origin || allowedOrigins().includes(origin)) return callback(null, true)
			return callback(new Error('Origin is not allowed by CORS.'))
		},
	}))
	app.use(express.json({ limit: '16kb' }))

	app.get('/health', async (request, response, next) => {
		try {
			const pool = await getPool()
			await pool.request().query('SELECT 1 AS ok')
			response.json({ status: 'ok', database: 'connected' })
		} catch (error) {
			next(error)
		}
	})

	app.use('/api/v1', createApiRouter(getPool, sql))
	app.use((request, response) => response.status(404).json({ detail: 'Not found.' }))
	app.use((error, request, response, next) => {
		if (response.headersSent) return next(error)
		if (error instanceof DatabaseConfigurationError) {
			return response.status(503).json({ detail: 'Database is not configured.' })
		}
		console.error('API request failed', {
			method: request.method,
			path: request.path,
			message: error.message,
		})
		return response.status(500).json({ detail: 'Internal server error.' })
	})

	return app
}
