import pm2 from 'pm2'
import chalk from 'chalk'

export function getLogs(moduleFilter?: string, limit: number = 50): Promise<string[]> {
  return new Promise((resolve, reject) => {
    pm2.connect(err => {
      if (err) return reject(err)

      pm2.describe('statehub-core', (err, list) => {
        if (err || !list || list.length === 0) {
          pm2.disconnect()
          return reject(new Error('statehub-core is not running.'))
        }

        const logPath = list[0].pm2_env?.pm_out_log_path
        if (!logPath) {
          pm2.disconnect()
          return reject(new Error('Unable to find PM2 log file.'))
        }

        import('fs').then(fs => {
          import('readline').then(readline => {
            const fileStream = fs.createReadStream(logPath, { encoding: 'utf-8' })

            const rl = readline.createInterface({
              input: fileStream,
              crlfDelay: Infinity
            })

            const lines: string[] = []

            rl.on('line', (line: string) => {
              if (!moduleFilter || line.includes(`[${moduleFilter}/`)) {
                lines.push(line)
              }
            })

            rl.on('close', () => {
              pm2.disconnect()
              const recent = lines.slice(-limit).map(l => formatLogLine(l))
              resolve(recent)
            })
          })
        }).catch(err => {
          pm2.disconnect()
          reject(err)
        })
      })
    })
  })
}

function formatLogLine(line: string): string {
  const timestamp = new Date().toISOString()
  return `${chalk.gray(`[${timestamp}]`)} ${line}`
}
