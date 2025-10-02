import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import App from "./App";

test("renders dashboard text", () => {
  render(<App />);
  expect(screen.getByText(/dashboard/i)).toBeInTheDocument();
});
