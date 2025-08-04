import { Command } from 'commander'
import chalk from 'chalk'
import { uninstallModule } from '../services/module-manager'

const uninstallCommand = new Command('uninstall')
  .description('Uninstall a module')
  .argument('<module>', 'Module name to uninstall (e.g., @statehub.pingpong)')
  .action(async (moduleName: string) => {
    try {
      uninstallModule(moduleName)
    } catch (error) {
      console.error(chalk.red(`Error: ${error instanceof Error ? error.message : String(error)}`))
      process.exit(1)
    }
  })

export default uninstallCommand
