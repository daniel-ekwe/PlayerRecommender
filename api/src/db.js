import sql from 'mssql'

export class DatabaseConfigurationError extends Error {
	constructor(message) {
		super(message)
		this.name = 'DatabaseConfigurationError'
	}
}

let poolPromise

function getDatabaseConfig() {
	const required = ['AZURE_SQL_SERVER', 'AZURE_SQL_DATABASE', 'AZURE_SQL_USER', 'AZURE_SQL_PASSWORD']
	const missing = required.filter((name) => !process.env[name])
	if (missing.length) {
		throw new DatabaseConfigurationError(`Missing database configuration: ${missing.join(', ')}`)
	}

	return {
		server: process.env.AZURE_SQL_SERVER,
		database: process.env.AZURE_SQL_DATABASE,
		user: process.env.AZURE_SQL_USER,
		password: process.env.AZURE_SQL_PASSWORD,
		port: Number(process.env.AZURE_SQL_PORT || 1433),
		options: {
			encrypt: process.env.AZURE_SQL_ENCRYPT !== 'false',
			trustServerCertificate: process.env.AZURE_SQL_TRUST_SERVER_CERTIFICATE === 'true',
		},
		pool: { min: 0, max: 5, idleTimeoutMillis: 30000 },
		connectionTimeout: 30000,
		requestTimeout: 30000,
	}
}

export function getDatabasePool() {
	if (!poolPromise) {
		poolPromise = new sql.ConnectionPool(getDatabaseConfig()).connect().catch((error) => {
			poolPromise = undefined
			throw error
		})
	}
	return poolPromise
}

export async function closeDatabasePool() {
	if (!poolPromise) return
	const activePool = await poolPromise
	poolPromise = undefined
	await activePool.close()
}

export { sql }
