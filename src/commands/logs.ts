import { Command } from 'commander'
import chalk from 'chalk'
import ora from 'ora'
import { getLogs, watchLogs } from '../services/log-viewer'

const logsCommand = new Command('logs')
  .description('View the server logs')
  .option('-m, --module <name>', 'Filter logs by module name')
  .option('-n, --limit <number>', 'Limit the number of log lines', '50')
  .option('-f, --follow', 'Follow log output in real-time')
  .action(options => viewLogs(options))

function viewLogs(options: any) {
  if (options.follow) {
    followLogs(options)
  } else {
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
}

function followLogs(options: any) {
  console.log(chalk.blue('Following logs in real-time... Press Ctrl+C or Q to quit.'))
  
  const spinner = ora('Loading recent logs...').start()
  
  getLogs(options.module, 25)
    .then(logs => {
      spinner.stop()
      
      if (logs.length > 0) {
        console.log(chalk.gray('--- Recent logs ---'))
        logs.forEach(log => console.log(log))
        console.log(chalk.gray('--- Live logs ---'))
      }
      
      return watchLogs(options.module)
    })
    .then(cleanup => {
      process.stdin.setRawMode(true)
      process.stdin.resume()
      process.stdin.setEncoding('utf8')
      
      process.stdin.on('data', (key: string) => {
        if (key === '\u0003' || key.toLowerCase() === 'q') {
          cleanup()
          console.log(chalk.yellow('\nStopped following logs.'))
          process.exit(0)
        }
      })
      
      process.on('SIGINT', () => {
        cleanup()
        console.log(chalk.yellow('\nStopped following logs.'))
        process.exit(0)
      })
    })
    .catch(err => {
      spinner.stop()
      console.error(chalk.red('Failed to follow logs:'), err)
      process.exit(1)
    })
}

export default logsCommand
