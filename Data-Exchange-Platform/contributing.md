## Style Guide
1. Use tabs in all files, instead of spaces.
2. Naming conventions - my_var, funcAsync, MyClass.
3. Follow the modern convention of using `let` and `const`, instead of `var` for declaring variables.

## About Branches
- When creating a new feature/change, always create a branch(in git), before making any significant changes to code. This keeps the master branch of the code stable.
- Branches should not be merged directly in `master`, but by creating a **Pull Request**. This allows for better communication on the new feature/change.

## External modules
- Try to minimize use of 3rd party libraries, whenever possible.
- Add modules to `package.json` before commit, by running `npm install --save express` or `npm install --save-dev nodemon`, whichever is appropriate.
