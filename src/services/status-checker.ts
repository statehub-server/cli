import pm2 from 'pm2'

export function getServerStatus(): Promise<{
  running: boolean
  status?: string
  memory?: string
  cpu?: string
  uptime?: string
}> {
  return new Promise((resolve, reject) => {
    pm2.connect(err => {
      if (err) return reject(err)

      pm2.describe('statehub-core', (err, desc) => {
        pm2.disconnect()

        if (err || !desc || desc.length === 0)
          return resolve({ running: false })

        const proc = desc[0]
        const status = proc.pm2_env?.status || 'unknown'
        const uptime = proc.pm2_env?.pm_uptime
          ? `${Math.floor((Date.now() - proc.pm2_env.pm_uptime) / 1000)}s`
          : 'N/A'
        const memory = proc.monit?.memory
          ? `${(proc.monit.memory / 1024 / 1024).toFixed(2)} MB`
          : 'N/A'
        const cpu = proc.monit?.cpu !== undefined ? `${proc.monit.cpu}%` : 'N/A'

        resolve({
          running: true,
          status,
          uptime,
          memory,
          cpu,
        })
      })
    })
  })
}

