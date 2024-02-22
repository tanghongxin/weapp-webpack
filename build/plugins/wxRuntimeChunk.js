/*
  剔除 所有scss文件入口打包后对应的chunk文件
*/
const path = require('path')
const webpack = require('webpack')
const { ConcatSource } = require('webpack-sources')
const ensurePosix = require('ensure-posix-path')
const requiredPath = require('required-path')
const WX_RUNTIME_CHUNK = 'WxRuntimeChunk'
const { ASSETS_CHUNK_NAME } = require('../utils/getEntries')
class WxRuntimeChunk {
  apply(compiler) {
    compiler.hooks.compilation.tap(WX_RUNTIME_CHUNK, (compilation) => {
      compilation.hooks.beforeChunkAssets.tap(WX_RUNTIME_CHUNK, (_) => {
        const { chunks, mainTemplate, chunkTemplate } = compilation
        const assetsChunk = [...chunks].find(
          (chunk) => chunk.name === ASSETS_CHUNK_NAME
        )
        assetsChunk && chunks.delete(assetsChunk)

        webpack.javascript.JavascriptModulesPlugin.getCompilationHooks(
          compilation
        ).render.tap(WX_RUNTIME_CHUNK, (source, context) => {
          // 非入口模块 或 包含runtime
          if (
            context.chunkGraph.getNumberOfEntryModules(context.chunk) === 0 ||
            context.chunk.hasRuntime()
          ) {
            return source
          }

          // 收集动态入口所有的依赖
          const dependencies = new Set()
          context.chunk.groupsIterable.forEach((group) => {
            group.chunks.forEach((chunk) => {
              const filename = ensurePosix(
                path.relative(path.dirname(context.chunk.name), chunk.name)
              )
              if (chunk === context.chunk) return
              dependencies.add(filename)
            })

          })

          // 没有依赖
          if (dependencies.size == 0) return
          // 源文件拼接依赖
          let concatStr = ';'
          dependencies.forEach((file) => {
            concatStr += `require('${requiredPath(file)}');`
          })
          return new ConcatSource(concatStr, source)
        })
      })
    })
    compiler.hooks.done.tap(WX_RUNTIME_CHUNK, (stats) => {})
  }
}
module.exports = WxRuntimeChunk
