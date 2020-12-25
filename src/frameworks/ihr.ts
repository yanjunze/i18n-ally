import { Config, Global, DirStructure } from '../core'
import { LanguageId } from '../utils'
import { Framework } from './base'
import { Log } from '../utils/Log';
import { TextDocument } from 'vscode';
import { ParsePathMatcher } from '../utils/PathMatcher';

class IhrFramework extends Framework {
  id = 'ihr'
  display = 'Ihr'

  detection = {
    packageJSON: [
      '@ihr/data-rangers',
      `@ihr/lib`,
      'vue-i18n',
      'vuex-i18n',
      '@panter/vue-i18next',
      'nuxt-i18n',
    ],
  }

  languageIds: LanguageId[] = [
    'vue',
    'vue-html',
    'javascript',
    'typescript',
    'javascriptreact',
    'typescriptreact',
    'ejs',
  ]

  // for visualize the regex, you can use https://regexper.com/
  usageMatchRegex = [
    '(?:i18n[ (\n]\\s*path=|v-t=[\'"`{]|(?:this\\.|\\$|i18n\\.|[^\\w\\d])(?:t|tc|te)\\()\\s*[\'"`]({key})[\'"`]',
  ]

  refactorTemplates(keypath: string, languageId: string) {
    return [
      `{{$t('${keypath}')}}`,
      `this.$t('${keypath}')`,
      `$t('${keypath}')`,
      `i18n.t('${keypath}')`,
      // vue-i18n-next
      `{{t('${keypath}')}}`,
      `t('${keypath}')`,
      keypath,
    ]
  }

  enableFeatures = {
    LinkedMessages: true,
  }

  pathMatcher(dirStructure?: DirStructure): string {
    return Config.ihrMatcher.replace('{moduleName}', '{namespace}');
    // if (dirStructure === 'file')
    //   return '{locale}.{ext}'
    // else if (Config.namespace)
    //   return '{locale}/**/{namespace}.{ext}'
    // else
    //   return '{locale}/**/*.{ext}'
  }

}

export default IhrFramework

export function getModuleNameFromFilepath(filepath: string) {
  if (!Config.ihrMatcher) return '';
  const rootFilePath = filepath.replace(Global.rootpath, '').replace(/\\/g, '/');
  const ihrMatcher: string = Config.ihrMatcher.replace('{moduleName}', '{namespace}');
  const paths = ihrMatcher.split('{namespace}');
  if (paths.length < 2) return '';
  const localesPaths = Config._localesPaths;
  const matchPaths = localesPaths.map(path => {
    const totalPath = (path + '/' + paths[0] + '{namespace}/**/*.*');
    return '/?' + totalPath.split('/').filter(v => v).join('/');
  });
  return matchPaths.reduce<string>((moduleName, path) => {
    if (moduleName) return moduleName;
    const matcher = ParsePathMatcher(path, Global.enabledParserExts)
    const match = matcher.exec(rootFilePath);
    return match?.groups?.namespace ?? '';
  }, '').replace(/\//g, '.');
}

export function getKeyPathWithModule(filepath: string | TextDocument, key?: string) {
  if (!Config.ihrMatcher) return key ?? '';
  const filePathStr = typeof filepath === 'string' ? filepath : filepath.uri.fsPath;
  const moduleName = getModuleNameFromFilepath(filePathStr);
  if (!key) return moduleName;
  else return moduleName + '.' + key;
}
