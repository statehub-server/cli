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

  // Google OAuth2 (Device + Web)
  .option('--google-client-id-device <id>', 'Google OAuth2 Client ID for device flow', '')
  .option('--google-client-id-web <id>', 'Google OAuth2 Client ID for web flow', '')
  .option('--google-client-secret-device <secret>', 'Google OAuth2 client secret for device flow', '')
  .option('--google-client-secret-web <secret>', 'Google OAuth2 client secret for web flow', '')
  .option('--google-redirect-uri <uri>', 'Google OAuth2 redirect URI for web flow', '')

  // Discord OAuth2
  .option('--discord-client-id-web <id>', 'Discord OAuth2 Client ID for web flow', '')
  .option('--discord-client-secret-web <secret>', 'Discord OAuth2 client secret for web flow', '')
  .option('--discord-redirect-uri <uri>', 'Discord OAuth2 redirect URI for web flow', '')

  .action(options => startServer(options))

function startServer(options: any) {
  const spinner = ora('Starting server...\n').start()
  process.env.PORT = process.env.PORT || options.port
  process.env.ORIGIN_WHITELIST = process.env.ORIGIN_WHITELIST || options.cors
  process.env.PG_URL = process.env.PG_URL || options.pgurl
  if (options.secret)
    process.env.SECRET_KEY = options.secret
  else if (!process.env.SECRET_KEY)
    process.env.SECRET_KEY = crypto.randomBytes(64).toString('hex')
 
  // Google OAuth2
  process.env.OAUTH_GOOGLE_CLIENT_ID_DEVICE = process.env.OAUTH_GOOGLE_CLIENT_ID_DEVICE
  || options.googleClientIdDevice
  process.env.OAUTH_GOOGLE_CLIENT_ID_WEB = process.env.OAUTH_GOOGLE_CLIENT_ID_WEB
  || options.googleClientIdWeb
  process.env.OAUTH_GOOGLE_CLIENT_SECRET_DEVICE = process.env.OAUTH_GOOGLE_CLIENT_SECRET_DEVICE
  || options.googleClientSecretDevice
  process.env.OAUTH_GOOGLE_CLIENT_SECRET_WEB = process.env.OAUTH_GOOGLE_CLIENT_SECRET_WEB
  || options.googleClientSecretWeb
  process.env.OAUTH_GOOGLE_REDIRECT_URI = process.env.OAUTH_GOOGLE_REDIRECT_URI
  || options.googleRedirectUri


  // Discord OAuth2
  process.env.OAUTH_DISCORD_CLIENT_ID_DEVICE = process.env.OAUTH_DISCORD_CLIENT_ID_DEVICE
  || options.discordClientIdDevice
  process.env.OAUTH_DISCORD_CLIENT_ID_WEB = process.env.OAUTH_DISCORD_CLIENT_ID_WEB
  || options.discordClientIdWeb
  process.env.OAUTH_DISCORD_CLIENT_SECRET_DEVICE = process.env.OAUTH_DISCORD_CLIENT_SECRET_DEVICE
  || options.discordClientSecretDevice
  process.env.OAUTH_DISCORD_CLIENT_SECRET_WEB = process.env.OAUTH_DISCORD_CLIENT_SECRET_WEB
  || options.discordClientSecretWeb
  process.env.OAUTH_DISCORD_REDIRECT_URI = process.env.OAUTH_DISCORD_REDIRECT_URI
  || options.discordRedirectUri


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
