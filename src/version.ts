import path from 'path'
import fs from 'fs'

export function getVersion(): string {
  const pkgPath = path.resolve(__dirname, '../package.json')
  try {
    const pkgJson = fs.readFileSync(pkgPath, 'utf8')
    const pkg = JSON.parse(pkgJson)
    return pkg.version || '0.0.0'
  } catch {
    return '0.0.0'
  }
}
