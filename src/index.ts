#!/usr/bin/env node
import { Command } from 'commander'
import { getVersion } from './version'
import startCommand from './commands/start'
import stopCommand from './commands/stop'
import statusCommand from './commands/status'
import logsCommand from './commands/logs'
import installCommand from './commands/install'
import uninstallCommand from './commands/uninstall'
import updateCommand from './commands/update'
import sourcesCommand from './commands/sources'
import modlistCommand from './commands/modlist'

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
program.addCommand(installCommand)
program.addCommand(uninstallCommand)
program.addCommand(updateCommand)
program.addCommand(sourcesCommand)
program.addCommand(modlistCommand)

program.parse(process.argv)
