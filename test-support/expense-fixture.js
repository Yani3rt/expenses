import { after } from "node:test";
import { createExpenseFixture } from "./fixture-factory.js";

export { createExpenseFixture } from "./fixture-factory.js";

export function useExpenseFixture(registerAfter = after) {
  const previousPath = process.env.EXPENSE_DB_PATH;
  const fixture = createExpenseFixture();
  process.env.EXPENSE_DB_PATH = fixture.path;

  const cleanup = () => {
    fixture.cleanup();
    if (previousPath === undefined) {
      delete process.env.EXPENSE_DB_PATH;
    } else {
      process.env.EXPENSE_DB_PATH = previousPath;
    }
  };

  registerAfter(cleanup);
  return { ...fixture, cleanup };
}
