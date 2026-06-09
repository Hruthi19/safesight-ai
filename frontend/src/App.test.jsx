import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import App from "./App";

jest.mock("./api/client", () => ({
  api: {
    login: jest.fn(),
    getIncidents: jest.fn(() => Promise.resolve({ data: [] })),
  },
}));

jest.mock("./components/detection/DetectionApp", () => () => <div>Detect</div>);

test("redirects unauthenticated users to login", async () => {
  window.history.pushState({}, "", "/");
  render(<App />);
  const text = await screen.findByText(/sign in to access/i);
  expect(text).toBeInTheDocument();
});
