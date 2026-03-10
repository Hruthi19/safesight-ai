import React from "react"
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import App from "./App";

global.fetch = jest.fn(() =>
  Promise.resolve({
    json: () =>
      Promise.resolve({
        data: [],
      }),
  })
);

test("renders dashboard text", async () => {
  render(<App />);
  const text = await screen.findByText(/incident dashboard/i);
  expect(text).toBeInTheDocument();
});
