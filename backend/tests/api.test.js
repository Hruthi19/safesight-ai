const request = require("supertest");
const app = require("../src/app");

describe("Health API", () => {
  it("should return ok on health check", async () => {
    const res = await request(app).get("/health");
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe("ok");
  });
});
