import "@testing-library/jest-dom/vitest";

/*
 * React needs telling that this is a test environment before it will let
 * `act()` flush effects quietly. Without it every hook test that updates state
 * prints a warning that is not about anything, which is the fastest way to
 * teach everyone to ignore warnings.
 */
declare global {
  var IS_REACT_ACT_ENVIRONMENT: boolean;
}

globalThis.IS_REACT_ACT_ENVIRONMENT = true;
