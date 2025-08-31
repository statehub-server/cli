import fs from 'fs'
import path from 'path'
import os from 'os'
import fetch from 'node-fetch'
import AdmZip from 'adm-zip'
import chalk from 'chalk'
import ora from 'ora'

export interface ModuleManifest {
  name: string
  description?: string
  version: string
  author: string
  license?: string
  entryPoint?: string
  repo?: string
  dependencies?: string[]
}

export interface RepositorySource {
  listName: string
  listDescription: string
  listUrl: string
  repositories: Record<string, string>
  maintainers: Record<string, string>
}

export interface Settings {
  [key: string]: any
}

const CACHE_DIR = path.join(os.homedir(), '.config', 'statehub', 'cache')
const MODULES_DIR = path.join(os.homedir(), '.config', 'statehub', 'modules')
const SETTINGS_FILE = path.join(os.homedir(), '.config', 'statehub', 'settings.json')
const OFFICIAL_REPO_URL = 'https://raw.githubusercontent.com/statehub-server/official-sources/refs/heads/main/sources.0.json'

export function ensureDirectories(): void {
  if (!fs.existsSync(CACHE_DIR)) {
    fs.mkdirSync(CACHE_DIR, { recursive: true })
  }
  if (!fs.existsSync(MODULES_DIR)) {
    fs.mkdirSync(MODULES_DIR, { recursive: true })
  }
  
  const settingsDir = path.dirname(SETTINGS_FILE)
  if (!fs.existsSync(settingsDir)) {
    fs.mkdirSync(settingsDir, { recursive: true })
  }
}

function validateUrl(url: string): boolean {
  try {
    const parsedUrl = new URL(url)
    return parsedUrl.protocol === 'https:'
  } catch {
    return false
  }
}

async function fetchJson(url: string): Promise<any> {
  if (!validateUrl(url)) {
    throw new Error('Invalid URL - only HTTPS URLs are allowed')
  }

  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.statusText}`)
  }
  return response.json()
}

async function downloadFile(url: string, outputPath: string): Promise<void> {
  if (!validateUrl(url)) {
    throw new Error('Invalid URL - only HTTPS URLs are allowed')
  }

  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Failed to download ${url}: ${response.statusText}`)
  }

  const arrayBuffer = await response.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)
  fs.writeFileSync(outputPath, buffer)
}

function getCachedSources(): RepositorySource[] {
  ensureDirectories()
  const sources: RepositorySource[] = []
  const files = fs.readdirSync(CACHE_DIR).filter(f => f.startsWith('source.') && f.endsWith('.json'))
  
  files.sort((a, b) => {
    const aNum = parseInt(a.match(/source\.(\d+)\.json/)?.[1] || '0')
    const bNum = parseInt(b.match(/source\.(\d+)\.json/)?.[1] || '0')
    return aNum - bNum
  })

  for (const file of files) {
    try {
      const content = fs.readFileSync(path.join(CACHE_DIR, file), 'utf-8')
      const source = JSON.parse(content) as RepositorySource
      sources.push(source)
    } catch (error) {
      console.warn(chalk.yellow(`Warning: Failed to parse ${file}`))
    }
  }

  return sources
}

function getNextSourceNumber(): number {
  ensureDirectories()
  const files = fs.readdirSync(CACHE_DIR).filter(f => f.startsWith('source.') && f.endsWith('.json'))
  const numbers = files.map(f => parseInt(f.match(/source\.(\d+)\.json/)?.[1] || '0'))
  return numbers.length > 0 ? Math.max(...numbers) + 1 : 0
}

export function getSettings(): Settings {
  ensureDirectories()
  if (!fs.existsSync(SETTINGS_FILE)) {
    return {}
  }
  try {
    const content = fs.readFileSync(SETTINGS_FILE, 'utf-8')
    return JSON.parse(content)
  } catch {
    return {}
  }
}

export function saveSettings(settings: Settings): void {
  ensureDirectories()
  fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2))
}

export async function ensureOfficialRepository(): Promise<void> {
  const sources = getCachedSources()
  const hasOfficial = sources.some(s => s.listUrl === OFFICIAL_REPO_URL)
  
  if (!hasOfficial) {
    const spinner = ora('Adding official repository...').start()
    try {
      const officialSource = await fetchJson(OFFICIAL_REPO_URL)
      const sourceFile = path.join(CACHE_DIR, 'source.0.json')
      fs.writeFileSync(sourceFile, JSON.stringify(officialSource, null, 2))
      spinner.succeed('Official repository added')
    } catch (error) {
      spinner.fail(`Failed to add official repository: ${error instanceof Error ? error.message : String(error)}`)
      throw error
    }
  }
}

export async function addRepository(name: string, url: string): Promise<void> {
  const spinner = ora(`Adding repository: ${name}`).start()
  
  try {
    const source = await fetchJson(url)
    
    // Validate source structure
    if (!source.listName || !source.repositories) {
      throw new Error('Invalid repository format')
    }

    // Check if repository already exists
    const sources = getCachedSources()
    const existing = sources.find(s => s.listName === name || s.listUrl === url)
    if (existing) {
      throw new Error('Repository already exists')
    }

    const sourceNumber = getNextSourceNumber()
    const sourceFile = path.join(CACHE_DIR, `source.${sourceNumber}.json`)
    fs.writeFileSync(sourceFile, JSON.stringify(source, null, 2))
    
    spinner.succeed(`Repository '${source.listName}' added successfully`)
  } catch (error) {
    spinner.fail(`Failed to add repository: ${error instanceof Error ? error.message : String(error)}`)
    throw error
  }
}

export function removeRepository(nameOrUrl: string): void {
  const sources = getCachedSources()
  const files = fs.readdirSync(CACHE_DIR).filter(f => f.startsWith('source.') && f.endsWith('.json'))
  
  let removed = false
  for (let i = 0; i < sources.length; i++) {
    const source = sources[i]
    if (source.listName === nameOrUrl || source.listUrl === nameOrUrl) {
      const sourceFile = path.join(CACHE_DIR, files[i])
      fs.unlinkSync(sourceFile)
      removed = true
      console.log(chalk.green(`Repository '${source.listName}' removed successfully`))
      break
    }
  }

  if (!removed) {
    throw new Error(`Repository '${nameOrUrl}' not found`)
  }
}

export function listRepositories(): void {
  const sources = getCachedSources()
  
  if (sources.length === 0) {
    console.log(chalk.yellow('No repositories cached'))
    return
  }

  console.log(chalk.bold('\nCached Repositories:'))
  console.log(chalk.gray('─'.repeat(50)))
  
  for (const source of sources) {
    const moduleCount = Object.keys(source.repositories).length
    const maintainerInfo = Object.entries(source.maintainers)
      .map(([name, email]) => `${name} <${email}>`)
      .join(', ')
    
    console.log(chalk.bold.cyan(source.listName))
    console.log(chalk.gray(`  Description: ${source.listDescription || 'N/A'}`))
    console.log(chalk.gray(`  Modules: ${moduleCount}`))
    console.log(chalk.gray(`  Maintainers: ${maintainerInfo || 'N/A'}`))
    console.log(chalk.gray(`  URL: ${source.listUrl}`))
    console.log()
  }
}

export async function refreshCache(): Promise<void> {
  const sources = getCachedSources()
  const files = fs.readdirSync(CACHE_DIR).filter(f => f.startsWith('source.') && f.endsWith('.json'))
  
  const spinner = ora('Refreshing repository cache...').start()
  
  try {
    for (let i = 0; i < sources.length; i++) {
      const source = sources[i]
      try {
        const updatedSource = await fetchJson(source.listUrl)
        const sourceFile = path.join(CACHE_DIR, files[i])
        fs.writeFileSync(sourceFile, JSON.stringify(updatedSource, null, 2))
      } catch (error) {
        console.warn(chalk.yellow(`Warning: Failed to refresh ${source.listName}: ${error instanceof Error ? error.message : String(error)}`))
      }
    }
    spinner.succeed('Repository cache refreshed')
  } catch (error) {
    spinner.fail(`Failed to refresh cache: ${error instanceof Error ? error.message : String(error)}`)
    throw error
  }
}

export function findModule(moduleName: string): { url: string; source: RepositorySource } | null {
  const sources = getCachedSources()
  
  for (const source of sources) {
    if (source.repositories[moduleName]) {
      return { url: source.repositories[moduleName], source }
    }
  }
  
  return null
}

// Get the proper module path for namespaced or regular modules
function getModulePath(moduleName: string): string {
  if (moduleName.startsWith('@')) {
    // For namespaced modules like @namespace/module, create @namespace/module directory
    return path.join(MODULES_DIR, moduleName)
  } else {
    // For regular modules, just use the module name
    return path.join(MODULES_DIR, moduleName)
  }
}

export async function installModule(moduleName: string): Promise<void> {
  await ensureOfficialRepository()
  await refreshCache()

  const moduleInfo = findModule(moduleName)
  if (!moduleInfo) {
    throw new Error(`Module '${moduleName}' not found in any repository`)
  }

  const modulePath = getModulePath(moduleName)
  
  if (fs.existsSync(modulePath)) {
    throw new Error(`Module '${moduleName}' is already installed`)
  }

  const spinner = ora(`Installing ${moduleName}...`).start()
  
  try {
    // Ensure the parent directory exists for namespaced modules
    const parentDir = path.dirname(modulePath)
    if (!fs.existsSync(parentDir)) {
      fs.mkdirSync(parentDir, { recursive: true })
    }
    
    // Download module zip
    const tempZip = path.join(os.tmpdir(), `${moduleName.replace(/[@\/]/g, '_')}_${Date.now()}.zip`)
    await downloadFile(moduleInfo.url, tempZip)
    
    spinner.text = `Extracting ${moduleName}...`
    
    // Extract zip
    const zip = new AdmZip(tempZip)
    zip.extractAllTo(modulePath, true)
    
    // Clean up temp file
    fs.unlinkSync(tempZip)
    
    spinner.text = `Validating ${moduleName}...`
    
    // Validate module
    const manifestPath = path.join(modulePath, 'manifest.json')
    const distPath = path.join(modulePath, 'dist')
    
    if (!fs.existsSync(manifestPath)) {
      throw new Error('Invalid module: missing manifest.json')
    }
    
    if (!fs.existsSync(distPath)) {
      throw new Error('Invalid module: missing dist/ directory')
    }
    
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8')) as ModuleManifest
    
    if (!manifest.name || !manifest.version || !manifest.author) {
      throw new Error('Invalid manifest: missing required fields (name, version, author)')
    }
    
    spinner.succeed(`Module '${moduleName}' installed successfully`)
  } catch (error) {
    // Clean up on failure
    if (fs.existsSync(modulePath)) {
      fs.rmSync(modulePath, { recursive: true })
    }
    spinner.fail(`Failed to install ${moduleName}: ${error instanceof Error ? error.message : String(error)}`)
    throw error
  }
}

export function uninstallModule(moduleName: string): void {
  const modulePath = getModulePath(moduleName)
  
  if (!fs.existsSync(modulePath)) {
    throw new Error(`Module '${moduleName}' is not installed`)
  }

  const spinner = ora(`Uninstalling ${moduleName}...`).start()
  
  try {
    // Remove module directory
    fs.rmSync(modulePath, { recursive: true })
    
    spinner.succeed(`Module '${moduleName}' uninstalled successfully`)
  } catch (error) {
    spinner.fail(`Failed to uninstall ${moduleName}: ${error instanceof Error ? error.message : String(error)}`)
    throw error
  }
}

export async function updateModule(moduleName: string): Promise<void> {
  const modulePath = getModulePath(moduleName)
  
  if (!fs.existsSync(modulePath)) {
    throw new Error(`Module '${moduleName}' is not installed`)
  }

  // Get current version
  const manifestPath = path.join(modulePath, 'manifest.json')
  const currentManifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8')) as ModuleManifest
  const currentVersion = currentManifest.version

  await refreshCache()

  const moduleInfo = findModule(moduleName)
  if (!moduleInfo) {
    throw new Error(`Module '${moduleName}' not found in any repository`)
  }

  const spinner = ora(`Updating ${moduleName}...`).start()
  
  try {
    // Backup current module
    const backupPath = path.join(os.tmpdir(), `${moduleName.replace(/[@\/]/g, '_')}_backup_${Date.now()}`)
    fs.cpSync(modulePath, backupPath, { recursive: true })
    
    try {
      // Remove current version
      fs.rmSync(modulePath, { recursive: true })
      
      // Download and install new version
      const tempZip = path.join(os.tmpdir(), `${moduleName.replace(/[@\/]/g, '_')}_${Date.now()}.zip`)
      await downloadFile(moduleInfo.url, tempZip)
      
      spinner.text = `Extracting ${moduleName}...`
      
      const zip = new AdmZip(tempZip)
      zip.extractAllTo(modulePath, true)
      
      fs.unlinkSync(tempZip)
      
      // Validate new version
      const newManifestPath = path.join(modulePath, 'manifest.json')
      const distPath = path.join(modulePath, 'dist')
      
      if (!fs.existsSync(newManifestPath) || !fs.existsSync(distPath)) {
        throw new Error('Invalid module: missing manifest.json or dist/ directory')
      }
      
      const newManifest = JSON.parse(fs.readFileSync(newManifestPath, 'utf-8')) as ModuleManifest
      
      // Clean up backup on success
      fs.rmSync(backupPath, { recursive: true })
      
      spinner.succeed(`Module '${moduleName}' updated from ${currentVersion} to ${newManifest.version}`)
    } catch (error) {
      // Restore backup on failure
      if (fs.existsSync(modulePath)) {
        fs.rmSync(modulePath, { recursive: true })
      }
      fs.cpSync(backupPath, modulePath, { recursive: true })
      fs.rmSync(backupPath, { recursive: true })
      throw error
    }
  } catch (error) {
    spinner.fail(`Failed to update ${moduleName}: ${error instanceof Error ? error.message : String(error)}`)
    throw error
  }
}

// Recursively find all modules in the modules directory
function findAllInstalledModules(): string[] {
  const modules: string[] = []
  
  if (!fs.existsSync(MODULES_DIR)) {
    return modules
  }
  
  function scanDirectory(dir: string, namespace?: string): void {
    const entries = fs.readdirSync(dir, { withFileTypes: true })
    
    for (const entry of entries) {
      if (entry.isDirectory()) {
        const entryPath = path.join(dir, entry.name)
        const manifestPath = path.join(entryPath, 'manifest.json')
        
        if (entry.name.startsWith('@') && !namespace) {
          // This is a namespace directory, scan inside it
          scanDirectory(entryPath, entry.name)
        } else if (fs.existsSync(manifestPath)) {
          // This is a module directory with manifest
          if (namespace) {
            modules.push(`${namespace}/${entry.name}`)
          } else {
            modules.push(entry.name)
          }
        }
      }
    }
  }
  
  scanDirectory(MODULES_DIR)
  return modules
}

export async function updateAllModules(): Promise<void> {
  const installedModules = findAllInstalledModules()
  
  if (installedModules.length === 0) {
    console.log(chalk.yellow('No modules installed to update'))
    return
  }
  
  console.log(chalk.blue(`Found ${installedModules.length} installed modules`))
  
  let updatedCount = 0
  let errorCount = 0
  
  for (const moduleName of installedModules) {
    try {
      await updateModule(moduleName)
      updatedCount++
    } catch (error) {
      errorCount++
      console.error(chalk.red(`Failed to update ${moduleName}: ${error instanceof Error ? error.message : String(error)}`))
    }
  }
  
  console.log()
  console.log(chalk.green(`✓ ${updatedCount} modules updated successfully`))
  if (errorCount > 0) {
    console.log(chalk.red(`✗ ${errorCount} modules failed to update`))
  }
}

export function listInstalledModules(extended: boolean = false): void {
  ensureDirectories()
  
  const moduleNames = findAllInstalledModules()
  
  if (moduleNames.length === 0) {
    console.log(chalk.yellow('No modules installed'))
    return
  }

  console.log(chalk.bold('\nInstalled Modules:'))
  console.log(chalk.gray('─'.repeat(50)))

  for (const moduleName of moduleNames) {
    const modulePath = getModulePath(moduleName)
    const manifestPath = path.join(modulePath, 'manifest.json')
    
    if (!fs.existsSync(manifestPath)) {
      console.log(chalk.red(`${moduleName} - Invalid (missing manifest.json)`))
      continue
    }

    try {
      const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8')) as ModuleManifest
      
      if (extended) {
        console.log(chalk.bold.cyan(manifest.name))
        console.log(chalk.gray(`  Version: ${manifest.version}`))
        console.log(chalk.gray(`  Description: ${manifest.description || 'N/A'}`))
        console.log(chalk.gray(`  Author: ${manifest.author}`))
        console.log(chalk.gray(`  License: ${manifest.license || 'N/A'}`))
        console.log(chalk.gray(`  Entry Point: ${manifest.entryPoint || 'dist/index.js'}`))
        
        // Extract and display namespace if present
        if (manifest.name.startsWith('@')) {
          const namespace = manifest.name.split('/')[0]
          console.log(chalk.gray(`  Namespace: ${namespace}`))
        }
        
        if (manifest.dependencies && manifest.dependencies.length > 0) {
          console.log(chalk.gray(`  Dependencies: ${manifest.dependencies.join(', ')}`))
        }
        if (manifest.repo) {
          console.log(chalk.gray(`  Repository: ${manifest.repo}`))
        }
        console.log()
      } else {
        console.log(`${chalk.cyan(manifest.name)} - ${chalk.gray(manifest.version)}`)
      }
    } catch (error) {
      console.log(chalk.red(`${moduleName} - Invalid (corrupted manifest.json)`))
    }
  }
}
