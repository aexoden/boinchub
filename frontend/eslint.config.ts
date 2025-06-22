import js from "@eslint/js";
import stylistic from "@stylistic/eslint-plugin";
import importPlugin from "eslint-plugin-import";
import prettier from "eslint-plugin-prettier/recommended";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import globals from "globals";
import tseslint from "typescript-eslint";

export default tseslint.config(
    stylistic.configs.customize({
        braceStyle: "1tbs",
        indent: 4,
        semi: true,
    }),
    { ignores: ["dist"] },
    {
        extends: [
            js.configs.recommended,
            ...tseslint.configs.strictTypeChecked,
            ...tseslint.configs.stylisticTypeChecked,
            {
                languageOptions: {
                    parserOptions: {
                        projectService: true,
                        tsconfigRootDir: import.meta.dirname,
                    },
                },
            },
            importPlugin.flatConfigs.recommended,
            importPlugin.flatConfigs.typescript,
            prettier,
        ],
        files: ["**/*.{js,ts,tsx}"],
        languageOptions: {
            ecmaVersion: 2020,
            globals: globals.browser,
        },
        plugins: {
            "@stylistic": stylistic,
            "react-hooks": reactHooks,
            "react-refresh": reactRefresh,
        },
        rules: {
            ...reactHooks.configs.recommended.rules,
            "@stylistic/arrow-parens": ["error", "always"],
            "@stylistic/linebreak-style": ["error", "unix"],
            "@stylistic/no-extra-parens": "error",
            "@stylistic/quotes": ["error", "double", { avoidEscape: true }],
            "@typescript-eslint/no-unused-vars": [
                "error",
                {
                    args: "all",
                    argsIgnorePattern: "^_",
                    caughtErrors: "all",
                    caughtErrorsIgnorePattern: "^_",
                    destructuredArrayIgnorePattern: "^_",
                    ignoreRestSiblings: true,
                    varsIgnorePattern: "^_",
                },
            ],
            "@typescript-eslint/prefer-promise-reject-errors": [
                "error",
                {
                    allowThrowingAny: true,
                },
            ],
            "import/no-unresolved": "off",
            "import/order": [
                "error",
                {
                    "alphabetize": { order: "asc" },
                    "named": true,
                    "newlines-between": "always",
                },
            ],
            "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],
        },
    },
);
