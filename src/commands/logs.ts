import { Command } from 'commander'
import chalk from 'chalk'
import ora from 'ora'
import { getLogs } from '../services/log-viewer'

const logsCommand = new Command('logs')
  .description('View the server logs')
  .option('-m, --module <name>', 'Filter logs by module name')
  .option('-n, --limit <number>', 'Limit the number of log lines', '50')
  .action(options => viewLogs(options))

function viewLogs(options: any) {
  const spinner = ora('Fetching logs...').start()

  getLogs(options.module, parseInt(options.limit))
    .then(logs => {
      spinner.stop()
      logs.forEach(log => console.log(log))
    })
    .catch(err => {
      spinner.stop()
      console.error(chalk.red('Failed to fetch logs:'), err)
    })
}

export default logsCommand
