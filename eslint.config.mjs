import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      // Stricter rules to catch unused imports and variables
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          "argsIgnorePattern": "^_",
          "varsIgnorePattern": "^_",
          "ignoreRestSiblings": true
        }
      ],
      "no-unused-vars": "off", // Disable base rule as it can report incorrect errors
      // Additional quality rules
      "@typescript-eslint/no-explicit-any": "warn",
      "prefer-const": "error",
      "no-var": "error",
      // Import organization
      "import/order": [
        "error",
        {
          "groups": [
            "builtin",
            "external", 
            "internal",
            ["parent", "sibling"],
            "index"
          ],
          "newlines-between": "never"
        }
      ]
    }
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**", 
    "build/**",
    "next-env.d.ts",
    // Test files
    "test-*.js",
  ]),
]);

export default eslintConfig;
