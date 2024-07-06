import * as yaml from 'js-yaml'
import * as path from 'path'
import * as fs from 'fs'
import * as process from 'process'
import * as _ from 'lodash'

export const getApplicationConfig = (mode?: NodeJS.ProcessEnv['ACTIVE']): Record<string, any> => {
  let fileMode = ``
  if (mode) fileMode = `.${mode}`
  const filePath = path.join(process.cwd(), 'src', `application${fileMode}.yaml`)
  return yaml.load(fs.readFileSync(filePath, 'utf-8')) as Record<string, any>
}

export const getLocalApplicationConfig = (): Record<string, any> => {
  const env = process.env.ACTIVE as NodeJS.ProcessEnv['ACTIVE']
  const defaultConfig = getApplicationConfig()
  const localConfig = getApplicationConfig(env)
  return _.assign(defaultConfig, localConfig)
}
