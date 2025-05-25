import { Command } from 'commander'
import chalk from 'chalk'
import ora from 'ora'
import { getServerStatus } from '../services/status-checker'

const statusCommand = new Command('status')
.description('Print the server core status and exit')
.action(status)

function status() {
  const spinner = ora('Checking server status...').start()
  
  getServerStatus()
  .then(info => {
    spinner.stop()
    
    if (!info.running) {
      console.log(chalk.red('Statehub core is not running.'))
      return
    }
    
    console.log(`${chalk.bold('Status')}: ${info.status === 'online' ?
      chalk.green(info.status!) : chalk.red(info.status!)}`)
    console.log(`${chalk.bold('Uptime')}: ${info.uptime}`)
    console.log(`${chalk.bold('Memory')}: ${info.memory}`)
    console.log(`${chalk.bold('CPU')}: ${info.cpu}`)
  })
  .catch(err => {
    spinner.fail('Failed to retrieve server status.')
    console.error(chalk.red(err))
  })
}

export default statusCommand
