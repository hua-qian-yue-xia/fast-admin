module.exports = {
  /**
   * 该配置项主要用于指示此.eslintrc文件是Eslint在项目内使用的根级别文件，
   * 并且 ESLint 不应在该目录之外搜索配置文件
   */
  root: true,
  /**
   * 默认情况下，Eslint使用其内置的 Espree 解析器，该解析器与标准 JavaScript 运行时和版本兼容，
   * 而我们需要将ts代码解析为eslint兼容的AST，所以此处我们使用 @typescript-eslint/parser。
   */
  parser: "@typescript-eslint/parser",
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:@typescript-eslint/eslint-recommended",
    "prettier",
  ],
  /**
   * 该配置项指示要加载的插件，这里
   * @typescript-eslint 插件使得我们能够在我们的存储库中使用typescript-eslint包定义的规则集。
   * prettier插件（即eslint-plugin-prettier）将 Prettier 规则转换为 ESLint 规则
   */
  plugins: ["@typescript-eslint", "prettier"],
  rules: {
    "prettier/prettier": "error",
    "arrow-body-style": "off",
    "prefer-arrow-callback": "off",
    "@typescript-eslint/no-explicit-any": "off",
    "@typescript-eslint/ban-ts-comment": "off", // 新增：禁用 ban-ts-comment 规则
    "@typescript-eslint/no-unused-vars": "off",
    "no-unused-vars": "off",
  },
}
