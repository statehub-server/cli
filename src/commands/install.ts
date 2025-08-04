import { Command } from 'commander'
import chalk from 'chalk'
import { installModule } from '../services/module-manager'

const installCommand = new Command('install')
  .description('Install a module from cached repositories')
  .argument('<module>', 'Module name to install (e.g., @statehub.pingpong)')
  .action(async (moduleName: string) => {
    try {
      await installModule(moduleName)
    } catch (error) {
      console.error(chalk.red(`Error: ${error instanceof Error ? error.message : String(error)}`))
      process.exit(1)
    }
  })

export default installCommand
