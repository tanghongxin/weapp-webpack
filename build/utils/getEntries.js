const path = require('path')
const { resolve } = path
const fs = require('fs')
const replaceExt = require('replace-ext')
const ensurePosixPath = require('ensure-posix-path')
const ASSETS_CHUNK_NAME = 'assetsChunkName'

const pkgJson = readJSON(resolve(__dirname, '../../package.json'))
const dependencies = Object.keys(pkgJson.dependencies || {})

function getEntries(context, entry){
    const entries = Object.assign(entry)
    const props = ['pages', 'subPackages', 'usingComponents']
    const appJson = readJSON(resolve(context, './app.json'))
    props.forEach((prop) => {
      const item = appJson[prop]
      if(typeof item != 'object') return
      Object.values(item).forEach((_path) => {
        // 子包拼接路径root
        if (prop == 'subPackages') {
          Object.values(_path.pages).forEach(($path) => {
            const finalPath = path.join(_path.root, $path)
            if (entries[finalPath]) return
            entries[finalPath] = './' + finalPath
          })
        } else {
          if (prop === 'usingComponents' && isDependency(_path)) return
          if(entries[_path]) return
          entries[_path] = './' + _path
        }
      })
    })

    const { app, ...otherEntries } = entries
    Object.assign(entries, getComponentsEntries(otherEntries, context))
  
    const styles = [];
    [...Object.values(entries)].forEach((entry) => {
      ['wxss', 'less', 'scss', 'sass'].forEach((ext) => {
        const style = ensurePosixPath(replaceExt(entry, `.${ext}`))
        if (fs.existsSync(path.join(context, style))) {
          styles.push(style)
        }
      })
    })
    entries[ASSETS_CHUNK_NAME] = styles

    return entries
}

function isDependency(p){
  return dependencies.findIndex(dependency => p.startsWith(dependency)) !== -1
}

function getComponentsEntries(entries, context) {
  const componentsEntries = {}

  function recursive(components, currentDir) {
    // 此时的p是未带文件后缀的相对路径
    Object.values(components).forEach(p => {
      if (isDependency(p)) return

      const fullPath = path.join(currentDir, p)
      const relativePath = path.relative(context, fullPath)
      componentsEntries[relativePath] = `./${relativePath}`

      const jsonPath = `${fullPath}.json`
      const jsonDir = path.dirname(jsonPath)
      if (fs.existsSync(jsonPath)) {
        const { usingComponents } = readJSON(jsonPath)
        if (usingComponents) recursive(usingComponents, jsonDir)
      }
    })
  }

  recursive(entries, context)

  return componentsEntries
}

function readJSON(p) {
  return JSON.parse(fs.readFileSync(p, 'utf-8'))
}

module.exports.getEntries = getEntries
module.exports.ASSETS_CHUNK_NAME = ASSETS_CHUNK_NAME
