import { Command } from 'commander'
import chalk from 'chalk'
import { updateModule, updateAllModules } from '../services/module-manager'

const updateCommand = new Command('update')
  .description('Update a module to the latest version, or all modules if no module specified')
  .argument('[module]', 'Module name to update (e.g., @statehub.pingpong)')
  .action(async (moduleName?: string) => {
    try {
      if (moduleName) {
        await updateModule(moduleName)
      } else {
        await updateAllModules()
      }
    } catch (error) {
      console.error(chalk.red(`Error: ${error instanceof Error ? error.message : String(error)}`))
      process.exit(1)
    }
  })

export default updateCommand
