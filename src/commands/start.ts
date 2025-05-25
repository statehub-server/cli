import { Command } from 'commander'
import chalk from 'chalk'
import ora from 'ora'
import crypto from 'crypto'
import { spawnServerService } from '../services/spawn'

const startCommand = new Command('start')
  .description('Start the Statehub server (core)')
  .option('--port <port>', 'Port', '3000')
  .option('--cors <urls>', 'CORS origin whitelist, comma-separated', '')
  .option('--pgurl <url>', 'URL to the PostgreSQL database', 'postgres://postgres:password@localhost:5432/statehub')
  .option('--secret <secret_key>', 'Secret key for jsonwebtokens', '')
  .action(options => startServer(options))

function startServer(options: any) {
  const spinner = ora('Starting server...\n').start()
  process.env.PORT = options.port
  process.env.ORIGIN_WHITELIST = options.cors
  process.env.PG_URL = options.pgurl
  process.env.SECRET_KEY = options.secretKey ?? crypto.randomBytes(64).toString('hex');

  spawnServerService()
    .then(() => {
      spinner.succeed(chalk.green(`Statehub core started via PM2 on port ${process.env.PORT}`))
    })
    .catch(err => {
      spinner.fail(chalk.red('Statehub initialization failed, exiting with error code 2'))
      process.exit(2)
    })
}

export default startCommand
