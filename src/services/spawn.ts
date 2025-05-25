import pm2 from 'pm2'
import path from 'path'
import chalk from 'chalk'

const coreEntry = path.resolve(__dirname, '../../core-dist/index.js')

export function spawnServerService() : Promise<void> {
  return new Promise((resolve, reject) => {
    pm2.connect(err => {
      if (err) {
        console.log(chalk.red('Unable to start pm2: ', err))
        return reject(err)
      }

      const safeEnv: { [key: string]: string } = {}
      for (const [key, value] of Object.entries(process.env)) {
        if (typeof value === 'string') {
          safeEnv[key] = value
        }
      }

      pm2.start({
        name: 'statehub-core',
        script: `${coreEntry}`,
        env: safeEnv,
      }, err => {
        pm2.disconnect()

        if (err) {
          console.log(chalk.red('Failed to start Statehub core:', err, '\n'))
          return reject(err)
        }
        
        resolve()
      })
    })
  })
}

export function despawnServerService() : Promise<void> {
  return new Promise((resolve, reject) => {
    pm2.connect(err => {
      if (err)
        return reject(err)

      pm2.delete('statehub-core', err => {
        pm2.disconnect()

        if (err)
          return reject(err)

        resolve()
      })
    })
  })
}
