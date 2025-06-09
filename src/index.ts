#!/usr/bin/env node
import { Command } from 'commander'
import { getVersion } from './version'
import startCommand from './commands/start'
import stopCommand from './commands/stop'
import statusCommand from './commands/status'
import logsCommand from './commands/logs'

const program = new Command()
const version = getVersion()

program
  .name('statehub')
  .description('Statehub CLI management program')
  .version(version)

program.addCommand(startCommand)
program.addCommand(stopCommand)
program.addCommand(statusCommand)
program.addCommand(logsCommand)

program.parse(process.argv)
