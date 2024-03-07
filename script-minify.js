const fs = require('fs-extra')
const chokidar = require('chokidar')
const tryToCatch = require('try-to-catch')

const assetsDir = 'assets'
const notMinifyDir = `${assetsDir}/NOT_MINIFY`

// Função para criar a pasta NOT_MINIFY
async function createNotMinifyFolder() {
  await fs.ensureDir(notMinifyDir)
}

// Função para copiar arquivos para a pasta NOT_MINIFY
async function copyFilesToNotMinify() {
  const files = await fs.readdir(assetsDir)

  for (const file of files) {
    if (file.endsWith('.js') || file.endsWith('.css')) {
      const sourcePath = `${assetsDir}/${file}`
      const destinationPath = `${notMinifyDir}/_${file}`

      // Verifica se o arquivo já existe na pasta NOT_MINIFY antes de copiá-lo
      if (!fs.existsSync(destinationPath)) {
        await fs.copyFile(sourcePath, destinationPath)
        console.log(`Criada pasta \u001b[33m${destinationPath}\u001b[0m`)
      }
    }
  }
}

// Função para minificar um arquivo
async function minifyFile(inputPath, outputPath, options = {}) {
  const { minify } = await import('minify')

  const [error, data] = await tryToCatch(minify, inputPath, options)

  if (error) {
    console.error(`\u001b[31mErro ao minificar o arquivo ${outputPath}:\u001b[0m`, error.message)
    return
  }

  await fs.writeFile(outputPath, data)
  console.log(`Arquivo \u001b[34m${outputPath}\u001b[0m minificado com sucesso!`)
}

// Função para minificar todos os arquivos .js e .css na pasta assets
async function minifyAllFiles() {
  const files = await fs.readdir(notMinifyDir)

  for (const file of files) {
    if (file.endsWith('.js') || file.endsWith('.css')) {
      const inputPath = `${notMinifyDir}/${file}`
      const outputPath = `${assetsDir}/${file.replace(/^_/, '')}`
      await minifyFile(inputPath, outputPath)
    }
  }

  console.log("\u001b[1m\u001b[7m*** TODOS OS ARQUIVOS FORAM MINIFICADOS ***\u001b[0m")
}

// Função para observar alterações
function watchFiles() {
  console.log("\u001b[35mObservando...\u001b[0m")

  chokidar.watch(`${notMinifyDir}/*.{js,css}`).on('all', async (event, path) => {
    if (event === 'change') {
      const fileName = path.split('\\').pop()
      const inputPath = path.replace(/\\/g, '/')
      const outputPath = `${assetsDir}/${fileName.replace(/^_/, '')}`

      if (!fs.existsSync(outputPath)) console.log(`Criada pasta \u001b[33m${outputPath}\u001b[0m`)

      await minifyFile(inputPath, outputPath)

      console.log(`Arquivo \u001b[32m${inputPath} \u001b[0mmodificado.`)
      console.log("\u001b[35mObservando...\u001b[0m")
    }
  })
}

async function initializeProject() {
  await createNotMinifyFolder()
  await copyFilesToNotMinify()
  await minifyAllFiles()
  watchFiles()
}

initializeProject()
