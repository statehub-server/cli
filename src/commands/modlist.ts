import { Command } from 'commander'
import chalk from 'chalk'
import { listInstalledModules } from '../services/module-manager'

const modlistCommand = new Command('modlist')
  .description('List installed modules')
  .option('-e, --extended', 'Show extended information about modules')
  .action((options) => {
    try {
      listInstalledModules(options.extended)
    } catch (error) {
      console.error(chalk.red(`Error: ${error instanceof Error ? error.message : String(error)}`))
      process.exit(1)
    }
  })

export default modlistCommand
