import { Command } from 'commander'
import chalk from 'chalk'
import { addRepository, listRepositories, removeRepository, ensureOfficialRepository } from '../services/module-manager'

const sourcesCommand = new Command('sources')
  .description('Manage module repositories')

sourcesCommand
  .command('add')
  .description('Add a new repository')
  .argument('<name>', 'Repository name')
  .argument('<url>', 'Repository URL')
  .action(async (name: string, url: string) => {
    try {
      await addRepository(name, url)
    } catch (error) {
      console.error(chalk.red(`Error: ${error instanceof Error ? error.message : String(error)}`))
      process.exit(1)
    }
  })

sourcesCommand
  .command('list')
  .description('List all cached repositories')
  .action(async () => {
    try {
      await ensureOfficialRepository()
      listRepositories()
    } catch (error) {
      console.error(chalk.red(`Error: ${error instanceof Error ? error.message : String(error)}`))
      process.exit(1)
    }
  })

sourcesCommand
  .command('del')
  .description('Remove a repository')
  .argument('<nameOrUrl>', 'Repository name or URL to remove')
  .action((nameOrUrl: string) => {
    try {
      removeRepository(nameOrUrl)
    } catch (error) {
      console.error(chalk.red(`Error: ${error instanceof Error ? error.message : String(error)}`))
      process.exit(1)
    }
  })

export default sourcesCommand
