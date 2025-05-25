import { Command } from 'commander'
import chalk from 'chalk'
import ora from 'ora'
import { despawnServerService, spawnServerService } from '../services/spawn'

const stopCommand = new Command('stop')
  .description('Stop the Statehub server (core)')
  .action(stopServer)

function stopServer() {
  const spinner = ora('Starting server service...\n').start()

  despawnServerService()
    .then(() => {
      spinner.succeed(chalk.green('Server stopped.'))
    })
    .catch(err => {
      spinner.fail(chalk.red(`Unable to stop Statehub core: ${err}`))
      process.exit(2)
    })
}

export default stopCommand
